const pool = require('../config/db');
const { writeAudit } = require('../utils/audit');

const isStaff = (user) => ['admin', 'commander'].includes(user.role);

const createSession = async (req, res) => {
  try {
    const { subjectId, batch, date, startTime, endTime, sessionType } = req.body;
    if (!subjectId || !date) return res.status(400).json({ message: 'Subject and date are required' });
    const subject = await pool.query('SELECT id FROM subjects WHERE id=$1 AND active=true', [subjectId]);
    if (!subject.rows.length) return res.status(400).json({ message: 'An active subject is required' });
    if (startTime && endTime && startTime >= endTime) return res.status(400).json({ message: 'End time must be later than start time' });
    const result = await pool.query('INSERT INTO attendance_sessions (subject_id, batch, session_date, start_time, end_time, session_type, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', [subjectId, batch || null, date, startTime || null, endTime || null, sessionType || 'class', req.user.id]);
    await writeAudit({ actorId: req.user.id, action: 'attendance_session.created', entityType: 'attendance_session', entityId: result.rows[0].id, after: result.rows[0] });
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getEligibleCadets = async (req, res) => {
  try {
    const { subjectId, batch } = req.query;
    if (!subjectId) return res.status(400).json({ message: 'subjectId is required' });
    const values = [subjectId];
    let batchFilter = '';
    if (batch) { values.push(batch); batchFilter = ` AND COALESCE(a.batch,p.batch)=$${values.length}`; }
    const result = await pool.query(`SELECT u.id,u.name,u.email,p.roll_no,p.batch,p.programme
      FROM subject_assignments a JOIN users u ON u.id=a.cadet_id
      LEFT JOIN cadet_profiles p ON p.user_id=u.id
      WHERE a.subject_id=$1 AND u.role='cadet' AND COALESCE(p.status,'active')='active'${batchFilter}
      ORDER BY u.name`, values);
    res.json(result.rows.map((row) => ({ ...row, _id: row.id })));
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getSessions = async (req, res) => {
  try {
    const { subjectId, date, batch } = req.query;
    const values = []; let where = 'WHERE 1=1';
    if (subjectId) { values.push(subjectId); where += ` AND a.subject_id = $${values.length}`; }
    if (date) { values.push(date); where += ` AND a.session_date = $${values.length}`; }
    if (batch) { values.push(batch); where += ` AND a.batch = $${values.length}`; }
    if (!isStaff(req.user)) { values.push(req.user.id); where += ` AND EXISTS (SELECT 1 FROM attendance_session_records ar WHERE ar.session_id = a.id AND ar.cadet_id = $${values.length})`; }
    const result = await pool.query(`SELECT a.*, s.name AS subject_name, COUNT(ar.id)::int AS record_count FROM attendance_sessions a JOIN subjects s ON s.id=a.subject_id LEFT JOIN attendance_session_records ar ON ar.session_id=a.id ${where} GROUP BY a.id,s.name ORDER BY a.session_date DESC,a.start_time DESC NULLS LAST`, values);
    res.json(result.rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getSessionRecords = async (req, res) => {
  try {
    const result = await pool.query(`SELECT r.id,r.session_id,r.cadet_id,r.status,r.marked_at,r.updated_at,
      u.name,u.email,p.roll_no,p.batch
      FROM attendance_session_records r
      JOIN users u ON u.id=r.cadet_id
      LEFT JOIN cadet_profiles p ON p.user_id=u.id
      WHERE r.session_id=$1
      ORDER BY u.name`, [req.params.sessionId]);
    res.json(result.rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const bulkRecords = async (req, res) => {
  const client = await pool.connect();
  try {
    const { sessionId, records } = req.body;
    if (!sessionId || !Array.isArray(records) || records.length === 0) return res.status(400).json({ message: 'Session and records are required' });
    const normalizedRecords = records.map((record) => ({ cadetId: Number(record.cadetId), status: record.status }));
    if (normalizedRecords.some((record) => !Number.isInteger(record.cadetId) || !['present', 'absent'].includes(record.status))) return res.status(400).json({ message: 'Each record needs a cadet and valid status' });
    const cadetIds = normalizedRecords.map((record) => record.cadetId);
    if (new Set(cadetIds).size !== cadetIds.length) return res.status(400).json({ message: 'Each cadet can appear only once in an attendance save' });
    await client.query('BEGIN');
    const session = await client.query('SELECT id,subject_id,batch FROM attendance_sessions WHERE id=$1', [sessionId]);
    if (!session.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Session not found' }); }
    const eligible = await client.query(`SELECT u.id FROM users u
      JOIN subject_assignments a ON a.cadet_id=u.id AND a.subject_id=$2
      LEFT JOIN cadet_profiles p ON p.user_id=u.id
      WHERE u.id = ANY($1::int[]) AND u.role='cadet' AND COALESCE(p.status,'active')='active'
      AND ($3::text IS NULL OR a.batch IS NULL OR a.batch=$3)`, [cadetIds, session.rows[0].subject_id, session.rows[0].batch]);
    if (eligible.rows.length !== cadetIds.length) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Cadets can be marked only when active and assigned to this subject and batch' }); }
    const existing = await client.query('SELECT * FROM attendance_session_records WHERE session_id=$1 AND cadet_id = ANY($2::int[])', [sessionId, cadetIds]);
    const existingByCadet = new Map(existing.rows.map((record) => [record.cadet_id, record]));
    const values = []; const parameters = [];
    normalizedRecords.forEach((record, index) => {
      const position = index * 4;
      values.push(`($${position + 1},$${position + 2},$${position + 3},$${position + 4},$${position + 4})`);
      parameters.push(sessionId, record.cadetId, record.status, req.user.id);
    });
    const saved = await client.query(`INSERT INTO attendance_session_records (session_id,cadet_id,status,marked_by,updated_by) VALUES ${values.join(',')} ON CONFLICT (session_id,cadet_id) DO UPDATE SET status=EXCLUDED.status,updated_by=EXCLUDED.updated_by,updated_at=CURRENT_TIMESTAMP RETURNING *`, parameters);
    const auditValues = []; const auditParameters = [];
    saved.rows.forEach((record, index) => {
      const position = index * 7;
      auditValues.push(`($${position + 1},$${position + 2},$${position + 3},$${position + 4},$${position + 5},$${position + 6}::jsonb,$${position + 7}::jsonb)`);
      auditParameters.push(req.user.id, existingByCadet.has(record.cadet_id) ? 'attendance_record.updated' : 'attendance_record.created', 'attendance_session_record', record.id, new Date(), JSON.stringify(existingByCadet.get(record.cadet_id) || null), JSON.stringify(record));
    });
    await client.query(`INSERT INTO audit_logs (actor_id,action,entity_type,entity_id,created_at,before_data,after_data) VALUES ${auditValues.join(',')}`, auditParameters);
    await client.query('COMMIT'); res.json({ message: 'Attendance saved' });
  } catch (error) { await client.query('ROLLBACK'); res.status(500).json({ message: error.message }); } finally { client.release(); }
};

const updateRecord = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['present', 'absent'].includes(status)) return res.status(400).json({ message: 'Status must be present or absent' });
    const before = await pool.query('SELECT * FROM attendance_session_records WHERE id=$1', [req.params.id]);
    if (!before.rows.length) return res.status(404).json({ message: 'Attendance record not found' });
    const result = await pool.query('UPDATE attendance_session_records SET status=$1,updated_by=$2,updated_at=CURRENT_TIMESTAMP WHERE id=$3 RETURNING *', [status, req.user.id, req.params.id]);
    await writeAudit({ actorId: req.user.id, action: 'attendance_record.updated', entityType: 'attendance_session_record', entityId: req.params.id, before: before.rows[0], after: result.rows[0] });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getMyAttendance = async (req, res) => {
  try {
    const cadetId = req.user.role === 'cadet' ? req.user.id : req.params.cadetId;
    if (!cadetId) return res.status(400).json({ message: 'Cadet is required' });
    const [history, summary] = await Promise.all([pool.query('SELECT r.*, a.session_date, a.start_time, a.end_time, a.session_type, a.batch, s.id AS subject_id, s.name AS subject_name FROM attendance_session_records r JOIN attendance_sessions a ON a.id=r.session_id JOIN subjects s ON s.id=a.subject_id WHERE r.cadet_id=$1 ORDER BY a.session_date DESC,a.start_time DESC NULLS LAST', [cadetId]), pool.query(`SELECT s.id AS subject_id,s.name AS subject_name,s.category,
      COUNT(r.id)::int AS total_sessions,
      COUNT(*) FILTER (WHERE r.status='present')::int AS present_count,
      COUNT(*) FILTER (WHERE r.status='absent')::int AS absent_count,
      COALESCE(ROUND(100.0*COUNT(*) FILTER (WHERE r.status='present')/NULLIF(COUNT(r.id),0),1),0) AS percentage
      FROM subject_assignments sa JOIN subjects s ON s.id=sa.subject_id
      LEFT JOIN attendance_sessions a ON a.subject_id=s.id AND (sa.batch IS NULL OR a.batch IS NULL OR a.batch=sa.batch)
      LEFT JOIN attendance_session_records r ON r.session_id=a.id AND r.cadet_id=sa.cadet_id
      WHERE sa.cadet_id=$1 GROUP BY s.id,s.name,s.category ORDER BY s.name`, [cadetId])]);
    res.json({ summary: summary.rows, history: history.rows });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { createSession, getSessions, getSessionRecords, getEligibleCadets, bulkRecords, updateRecord, getMyAttendance };
