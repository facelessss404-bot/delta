const crypto = require('crypto');
const path = require('path');
const pool = require('../config/db');
const storage = require('../config/supabaseStorage');

const notesBucket = () => process.env.SUPABASE_NOTES_BUCKET || 'training-notes';
const safeFilename = (name) => path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');

const getNotes = async (req, res) => {
  try {
    const params = []; let where = '';
    if (req.query.subjectId) { params.push(req.query.subjectId); where = ' WHERE n.subject_id=$1'; }
    const result = await pool.query(`SELECT n.*,u.name AS uploader_name,s.name AS subject_name FROM notes n JOIN users u ON u.id=n.uploaded_by LEFT JOIN subjects s ON s.id=n.subject_id${where} ORDER BY n.created_at DESC`, params);
    res.json(result.rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const uploadNote = async (req, res) => {
  try {
    if (!req.file || !req.body.title) return res.status(400).json({ message: 'File and title are required' });
    const key = `notes/${req.user.id}/${crypto.randomUUID()}-${safeFilename(req.file.originalname)}`;
    await storage.uploadBuffer({ bucket: notesBucket(), key, buffer: req.file.buffer, contentType: req.file.mimetype });
    try {
      const result = await pool.query('INSERT INTO notes(title,description,subject_id,file_path,file_size,mime_type,uploaded_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *', [req.body.title.trim(), req.body.description || null, req.body.subject_id || null, key, req.file.size, req.file.mimetype, req.user.id]);
      res.status(201).json(result.rows[0]);
    } catch (error) { await storage.removeObject({ bucket: notesBucket(), key }); throw error; }
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteNote = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notes WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Note not found' });
    const note = result.rows[0];
    if (req.user.role !== 'admin' && note.uploaded_by !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    await storage.removeObject({ bucket: notesBucket(), key: note.file_path });
    await pool.query('DELETE FROM notes WHERE id=$1', [note.id]);
    res.json({ message: 'Note deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const downloadNote = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notes WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Note not found' });
    const note = result.rows[0];
    const file = await storage.downloadObject({ bucket: notesBucket(), key: note.file_path });
    res.setHeader('Content-Type', note.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename(path.basename(note.file_path).replace(/^[0-9a-f-]+-/, ''))}"`);
    res.send(Buffer.from(await file.arrayBuffer()));
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getNotes, uploadNote, deleteNote, downloadNote };
