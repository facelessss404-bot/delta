const pool = require('../config/db');

const getExams = async (req, res) => {
  try {
    const result = await pool.query(`SELECT e.*, s.name as subject_name, u.name as creator_name FROM exams e LEFT JOIN subjects s ON e.subject_id = s.id LEFT JOIN users u ON e.created_by = u.id ORDER BY e.exam_date DESC`);
    res.json(result.rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const createExam = async (req, res) => {
  try {
    const { name, exam_type, subject_id, max_marks, exam_date } = req.body;
    if (!name || !max_marks) return res.status(400).json({ message: 'Name and max_marks required' });
    const result = await pool.query(
      `INSERT INTO exams (name, exam_type, subject_id, max_marks, exam_date, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, exam_type || 'written', subject_id || null, max_marks, exam_date || new Date(), req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getExams, createExam };
