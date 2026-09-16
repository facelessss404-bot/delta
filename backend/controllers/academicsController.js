const pool = require('../config/db');
const { writeAudit } = require('../utils/audit');

const createAssessment = async (req, res) => {
  try {
    const { subjectId, title, assessmentType, date, maxMarks } = req.body;
    if (!title || !date || !Number(maxMarks) || Number(maxMarks) <= 0) return res.status(400).json({ message: 'Title, date, and positive maximum marks are required' });
    const result = await pool.query('INSERT INTO assessments (subject_id,title,assessment_type,assessment_date,max_marks,created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [subjectId || null, title, assessmentType || 'written', date, maxMarks, req.user.id]);
    await writeAudit({ actorId: req.user.id, action: 'assessment.created', entityType: 'assessment', entityId: result.rows[0].id, after: result.rows[0] });
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
const listAssessments = async (req, res) => { try { const result = await pool.query('SELECT a.*,s.name AS subject_name,u.name AS creator_name FROM assessments a LEFT JOIN subjects s ON s.id=a.subject_id JOIN users u ON u.id=a.created_by ORDER BY a.assessment_date DESC'); res.json(result.rows); } catch (error) { res.status(500).json({ message: error.message }); } };
const saveMark = async (req, res) => {
  try {
    const { assessmentId, cadetId, marks, remarks } = req.body;
    if (!assessmentId || !cadetId || marks === undefined || Number(marks) < 0) return res.status(400).json({ message: 'Assessment, cadet, and valid marks are required' });
    const assessment = await pool.query('SELECT max_marks FROM assessments WHERE id=$1', [assessmentId]);
    if (!assessment.rows.length) return res.status(404).json({ message: 'Assessment not found' });
    const cadet = await pool.query("SELECT id FROM users WHERE id=$1 AND role='cadet'", [cadetId]);
    if (!cadet.rows.length) return res.status(400).json({ message: 'A valid cadet is required' });
    if (Number(marks) > Number(assessment.rows[0].max_marks)) return res.status(400).json({ message: 'Marks cannot exceed the maximum' });
    const before = await pool.query('SELECT * FROM assessment_marks WHERE assessment_id=$1 AND cadet_id=$2', [assessmentId, cadetId]);
    const result = await pool.query('INSERT INTO assessment_marks (assessment_id,cadet_id,marks,remarks,entered_by) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (assessment_id,cadet_id) DO UPDATE SET marks=EXCLUDED.marks,remarks=EXCLUDED.remarks,entered_by=EXCLUDED.entered_by,updated_at=CURRENT_TIMESTAMP RETURNING *', [assessmentId, cadetId, marks, remarks || null, req.user.id]);
    await writeAudit({ actorId: req.user.id, action: before.rows.length ? 'mark.updated' : 'mark.created', entityType: 'assessment_mark', entityId: result.rows[0].id, before: before.rows[0], after: result.rows[0] }); res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
const updateMark = async (req, res) => {
  try {
    const { marks, remarks } = req.body;
    if (marks === undefined || Number(marks) < 0) return res.status(400).json({ message: 'A valid mark is required' });
    const before = await pool.query(`SELECT m.*,a.max_marks FROM assessment_marks m JOIN assessments a ON a.id=m.assessment_id WHERE m.id=$1`, [req.params.id]);
    if (!before.rows.length) return res.status(404).json({ message: 'Mark not found' });
    if (Number(marks) > Number(before.rows[0].max_marks)) return res.status(400).json({ message: 'Marks cannot exceed the maximum' });
    const result = await pool.query('UPDATE assessment_marks SET marks=$1,remarks=$2,entered_by=$3,updated_at=CURRENT_TIMESTAMP WHERE id=$4 RETURNING *', [marks, remarks || null, req.user.id, req.params.id]);
    await writeAudit({ actorId: req.user.id, action: 'mark.updated', entityType: 'assessment_mark', entityId: req.params.id, before: before.rows[0], after: result.rows[0] });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
const getMarks = async (req, res) => { try { const cadetId = req.user.role === 'cadet' ? req.user.id : req.params.cadetId; if (!cadetId) return res.status(400).json({ message: 'Cadet is required' }); const result = await pool.query('SELECT m.*,a.title,a.assessment_type,a.assessment_date,a.max_marks,s.name AS subject_name FROM assessment_marks m JOIN assessments a ON a.id=m.assessment_id LEFT JOIN subjects s ON s.id=a.subject_id WHERE m.cadet_id=$1 ORDER BY a.assessment_date DESC',[cadetId]); res.json(result.rows); } catch (error) { res.status(500).json({ message: error.message }); } };
module.exports = { createAssessment, listAssessments, saveMark, updateMark, getMarks };
