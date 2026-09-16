const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { writeAudit } = require('../utils/audit');

const format = (row) => ({ ...row, _id: row.id });
const cadetSelect = `SELECT u.id,u.name,u.email,u.role,u.created_at,u.updated_at,
  p.roll_no,p.batch,p.programme,p.status
  FROM users u LEFT JOIN cadet_profiles p ON p.user_id=u.id`;

const getCadets = async (_req, res) => {
  try {
    const result = await pool.query(`${cadetSelect} WHERE u.role='cadet' ORDER BY u.name`);
    res.json(result.rows.map(format));
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getCadetById = async (req, res) => {
  try {
    const result = await pool.query(`${cadetSelect} WHERE u.id=$1 AND u.role='cadet'`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Cadet not found' });
    res.json(format(result.rows[0]));
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const createCadet = async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, email, password, rollNo, batch, programme, status = 'active' } = req.body;
    if (!name?.trim() || !email?.trim() || !password || password.length < 8) return res.status(400).json({ message: 'Name, email, and an 8-character password are required' });
    if (!['active', 'inactive'].includes(status)) return res.status(400).json({ message: 'Invalid cadet status' });
    await client.query('BEGIN');
    const exists = await client.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase().trim()]);
    if (exists.rows.length) { await client.query('ROLLBACK'); return res.status(409).json({ message: 'User already exists' }); }
    const hash = await bcrypt.hash(password, 10);
    const user = await client.query("INSERT INTO users(name,email,password,role) VALUES($1,$2,$3,'cadet') RETURNING id,name,email,role,created_at,updated_at", [name.trim(), email.toLowerCase().trim(), hash]);
    const profile = await client.query('INSERT INTO cadet_profiles(user_id,roll_no,batch,programme,status) VALUES($1,$2,$3,$4,$5) RETURNING roll_no,batch,programme,status', [user.rows[0].id, rollNo?.trim() || null, batch?.trim() || null, programme?.trim() || null, status]);
    await client.query('COMMIT');
    const cadet = format({ ...user.rows[0], ...profile.rows[0] });
    await writeAudit({ actorId: req.user.id, action: 'cadet.created', entityType: 'user', entityId: cadet.id, after: cadet, client });
    res.status(201).json(cadet);
  } catch (error) { await client.query('ROLLBACK'); res.status(500).json({ message: error.message }); } finally { client.release(); }
};

const updateCadet = async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, rollNo, batch, programme, status } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });
    if (status && !['active', 'inactive'].includes(status)) return res.status(400).json({ message: 'Invalid cadet status' });
    await client.query('BEGIN');
    const before = await client.query(`${cadetSelect} WHERE u.id=$1 AND u.role='cadet'`, [req.params.id]);
    if (!before.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Cadet not found' }); }
    await client.query('UPDATE users SET name=$1,updated_at=CURRENT_TIMESTAMP WHERE id=$2', [name.trim(), req.params.id]);
    const profile = await client.query(`INSERT INTO cadet_profiles(user_id,roll_no,batch,programme,status) VALUES($1,$2,$3,$4,COALESCE($5,'active'))
      ON CONFLICT(user_id) DO UPDATE SET roll_no=EXCLUDED.roll_no,batch=EXCLUDED.batch,programme=EXCLUDED.programme,status=COALESCE($5,cadet_profiles.status),updated_at=CURRENT_TIMESTAMP
      RETURNING roll_no,batch,programme,status`, [req.params.id, rollNo?.trim() || null, batch?.trim() || null, programme?.trim() || null, status || null]);
    const saved = await client.query(`${cadetSelect} WHERE u.id=$1`, [req.params.id]);
    await client.query('COMMIT');
    await writeAudit({ actorId: req.user.id, action: 'cadet.updated', entityType: 'user', entityId: req.params.id, before: before.rows[0], after: saved.rows[0], client });
    res.json(format(saved.rows[0]));
  } catch (error) { await client.query('ROLLBACK'); res.status(500).json({ message: error.message }); } finally { client.release(); }
};

const getCadetSubjects = async (req, res) => {
  try {
    const result = await pool.query(`SELECT s.id,s.name,s.code,s.category,s.active,a.batch,a.assigned_at FROM subject_assignments a JOIN subjects s ON s.id=a.subject_id WHERE a.cadet_id=$1 ORDER BY s.name`, [req.params.id]);
    res.json(result.rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const replaceCadetSubjects = async (req, res) => {
  const client = await pool.connect();
  try {
    const { subjectIds, batch } = req.body;
    if (!Array.isArray(subjectIds) || subjectIds.some((id) => !Number(id))) return res.status(400).json({ message: 'subjectIds must be an array of subject IDs' });
    const cadet = await client.query("SELECT id FROM users WHERE id=$1 AND role='cadet'", [req.params.id]);
    if (!cadet.rows.length) return res.status(404).json({ message: 'Cadet not found' });
    const uniqueIds = [...new Set(subjectIds.map(Number))];
    if (uniqueIds.length) { const subjects = await client.query('SELECT id FROM subjects WHERE active=true AND id = ANY($1::int[])', [uniqueIds]); if (subjects.rows.length !== uniqueIds.length) return res.status(400).json({ message: 'One or more active subjects were not found' }); }
    await client.query('BEGIN');
    const before = await client.query('SELECT subject_id,batch FROM subject_assignments WHERE cadet_id=$1', [req.params.id]);
    await client.query('DELETE FROM subject_assignments WHERE cadet_id=$1', [req.params.id]);
    if (uniqueIds.length) {
      const assignmentValues = uniqueIds.map((_, index) => `($1,$${index + 2},$${uniqueIds.length + 2})`).join(',');
      await client.query(`INSERT INTO subject_assignments(cadet_id,subject_id,batch) VALUES ${assignmentValues}`, [req.params.id, ...uniqueIds, batch?.trim() || null]);
    }
    await client.query('COMMIT');
    await writeAudit({ actorId: req.user.id, action: 'cadet.subjects_updated', entityType: 'cadet_subject_assignment', entityId: req.params.id, before: before.rows, after: uniqueIds, client });
    res.status(204).end();
  } catch (error) { await client.query('ROLLBACK'); res.status(500).json({ message: error.message }); } finally { client.release(); }
};

const deleteCadet = async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM users WHERE id=$1 AND role='cadet' RETURNING id,name,email,role", [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Cadet not found' });
    await writeAudit({ actorId: req.user.id, action: 'cadet.deleted', entityType: 'user', entityId: req.params.id, before: result.rows[0] });
    res.json({ message: 'Cadet removed' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getCadets, getCadetById, createCadet, updateCadet, deleteCadet, getCadetSubjects, replaceCadetSubjects };
