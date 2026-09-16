const pool = require('../config/db');

const getResults = async (req, res) => {
  try {
    const { examId, cadetId } = req.query;
    let query = `SELECT r.*, e.name as exam_name, e.max_marks, e.exam_date, u.name as cadet_name FROM results r JOIN exams e ON r.exam_id = e.id JOIN users u ON r.cadet_id = u.id WHERE 1=1`;
    const params = [];
    if (examId) { params.push(examId); query += ` AND r.exam_id = $${params.length}`; }
    if (cadetId) { params.push(cadetId); query += ` AND r.cadet_id = $${params.length}`; }
    query += ` ORDER BY e.exam_date DESC, u.name ASC`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getMyResults = async (req, res) => {
  try {
    const result = await pool.query(`SELECT r.*, e.name as exam_name, e.exam_type, e.max_marks, e.exam_date FROM results r JOIN exams e ON r.exam_id = e.id WHERE r.cadet_id = $1 ORDER BY e.exam_date ASC`, [req.user.id]);
    res.json(result.rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const upsertResult = async (req, res) => {
  try {
    const { exam_id, cadet_id, marks_obtained, remarks } = req.body;
    if (!exam_id || !cadet_id || marks_obtained === undefined) return res.status(400).json({ message: 'Missing fields' });
    const result = await pool.query(
      `INSERT INTO results (exam_id, cadet_id, marks_obtained, remarks, graded_by) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (exam_id, cadet_id) DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained, remarks = EXCLUDED.remarks, graded_by = EXCLUDED.graded_by, created_at = CURRENT_TIMESTAMP RETURNING *`,
      [exam_id, cadet_id, marks_obtained, remarks || null, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteResult = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM results WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getResults, getMyResults, upsertResult, deleteResult };
