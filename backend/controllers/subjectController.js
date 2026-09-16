const pool = require('../config/db');
const { writeAudit } = require('../utils/audit');
const format = (row) => ({ ...row, _id: row.id });

const getSubjects = async (_req, res) => {
  try { const result = await pool.query('SELECT id,name,code,category,active,created_at,updated_at FROM subjects ORDER BY name'); res.json(result.rows.map(format)); }
  catch (error) { res.status(500).json({ message: error.message }); }
};

const validate = ({ name, code, category, active }) => {
  if (!name?.trim()) return 'Subject name is required';
  if (code !== undefined && code !== null && code.length > 40) return 'Subject code is too long';
  if (category !== undefined && (!String(category).trim() || String(category).length > 80)) return 'A valid subject category is required';
  if (active !== undefined && typeof active !== 'boolean') return 'active must be true or false';
  return null;
};

const createSubject = async (req, res) => {
  try {
    const error = validate(req.body); if (error) return res.status(400).json({ message: error });
    const { name, code, category, active } = req.body;
    const result = await pool.query('INSERT INTO subjects(name,code,category,active) VALUES($1,$2,$3,$4) RETURNING *', [name.trim(), code?.trim() || null, category?.trim() || 'academic', active ?? true]);
    const subject = format(result.rows[0]); await writeAudit({ actorId: req.user.id, action: 'subject.created', entityType: 'subject', entityId: subject.id, after: subject }); res.status(201).json(subject);
  } catch (error) { res.status(error.code === '23505' ? 409 : 500).json({ message: error.code === '23505' ? 'Subject name or code already exists' : error.message }); }
};

const updateSubject = async (req, res) => {
  try {
    const error = validate(req.body); if (error) return res.status(400).json({ message: error });
    const before = await pool.query('SELECT * FROM subjects WHERE id=$1', [req.params.id]); if (!before.rows.length) return res.status(404).json({ message: 'Subject not found' });
    const { name, code, category, active } = req.body;
    const result = await pool.query('UPDATE subjects SET name=$1,code=$2,category=$3,active=$4,updated_at=CURRENT_TIMESTAMP WHERE id=$5 RETURNING *', [name.trim(), code?.trim() || null, category?.trim() || 'academic', active ?? true, req.params.id]);
    const subject = format(result.rows[0]); await writeAudit({ actorId: req.user.id, action: 'subject.updated', entityType: 'subject', entityId: subject.id, before: before.rows[0], after: subject }); res.json(subject);
  } catch (error) { res.status(error.code === '23505' ? 409 : 500).json({ message: error.code === '23505' ? 'Subject name or code already exists' : error.message }); }
};

const deleteSubject = async (req, res) => {
  try { const result = await pool.query('DELETE FROM subjects WHERE id=$1 RETURNING *', [req.params.id]); if (!result.rows.length) return res.status(404).json({ message: 'Subject not found' }); await writeAudit({ actorId: req.user.id, action: 'subject.deleted', entityType: 'subject', entityId: req.params.id, before: result.rows[0] }); res.json({ message: 'Subject deleted' }); }
  catch (error) {
    const hasRelatedRecords = error.code === '23503' || /foreign key constraint|violates RESTRICT/i.test(error.message || '');
    res.status(hasRelatedRecords ? 409 : 500).json({ message: hasRelatedRecords ? 'A subject with related records cannot be deleted; deactivate it instead' : error.message });
  }
};
module.exports = { getSubjects, createSubject, updateSubject, deleteSubject };
