const crypto = require('crypto');
const path = require('path');
const pool = require('../config/db');
const storage = require('../config/supabaseStorage');
const { writeAudit } = require('../utils/audit');

const videosBucket = () => process.env.SUPABASE_VIDEOS_BUCKET || 'physical-videos';
const maximumVideoSize = 50 * 1024 * 1024;
const permittedVideoTypes = new Set(['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']);
const safeFilename = (name) => path.basename(name || 'video').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255);
const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
const validVideoMetadata = ({ activityType, activityDate, filename, mimeType, size }) => activityType?.trim() && validDate(activityDate) && filename && permittedVideoTypes.has(mimeType) && Number.isFinite(size) && size > 0 && size <= maximumVideoSize;
const hasExpectedVideoSignature = (buffer, mimeType) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return false;
  if (mimeType === 'video/webm') return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (mimeType === 'video/ogg') return buffer.subarray(0, 4).toString('ascii') === 'OggS';
  // MP4 and QuickTime are ISO base-media files: their file-type box starts at byte 4.
  return buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp';
};

const requestUpload = async (req, res) => {
  try {
    const { activityType, activityDate, filename, mimeType, fileSize } = req.body;
    const size = Number(fileSize);
    if (!validVideoMetadata({ activityType, activityDate, filename, mimeType, size })) {
      return res.status(400).json({ message: 'Provide a training activity, valid date, video file, and a file size up to 50 MB.' });
    }
    const storageKey = `cadets/${req.user.id}/${crypto.randomUUID()}-${safeFilename(filename)}`;
    const { uploadUrl, uploadToken } = await storage.createSignedUpload({ bucket: videosBucket(), key: storageKey });
    res.json({ storageKey, uploadUrl, uploadToken, maxFileSize: maximumVideoSize });
  } catch (error) { res.status(503).json({ message: error.message }); }
};

const completeUpload = async (req, res) => {
  try {
    const { activityType, activityDate, storageKey, filename, mimeType, fileSize } = req.body;
    const size = Number(fileSize);
    if (!validVideoMetadata({ activityType, activityDate, filename, mimeType, size }) || !storageKey?.startsWith(`cadets/${req.user.id}/`)) {
      return res.status(400).json({ message: 'Complete upload metadata is invalid.' });
    }
    const object = await storage.headObject({ bucket: videosBucket(), key: storageKey });
    const storedSize = Number(object.headers.get('content-length'));
    if (Number.isFinite(storedSize) && storedSize !== size) return res.status(400).json({ message: 'Uploaded file size does not match.' });
    const storedType = object.headers.get('content-type') || '';
    if (storedType && storedType.split(';')[0].trim().toLowerCase() !== mimeType) return res.status(400).json({ message: 'Uploaded file type does not match.' });
    const prefix = await storage.readObjectPrefix({ bucket: videosBucket(), key: storageKey });
    if (!hasExpectedVideoSignature(prefix.buffer, mimeType)) return res.status(400).json({ message: 'Uploaded file is not a valid video of the declared type.' });
    const result = await pool.query('INSERT INTO physical_submissions (cadet_id,activity_type,activity_date,storage_key,filename,mime_type,file_size,upload_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [req.user.id, activityType.trim(), activityDate, storageKey, safeFilename(filename), mimeType, size, 'uploaded']);
    await writeAudit({ actorId: req.user.id, action: 'physical_submission.created', entityType: 'physical_submission', entityId: result.rows[0].id, after: result.rows[0] });
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const listPhysical = async (req, res) => {
  try {
    const cadetId = req.user.role === 'cadet' ? req.user.id : req.params.cadetId;
    if (!cadetId) return res.status(400).json({ message: 'Cadet is required' });
    const result = await pool.query('SELECT p.*,u.name AS cadet_name,r.name AS reviewer_name FROM physical_submissions p JOIN users u ON u.id=p.cadet_id LEFT JOIN users r ON r.id=p.reviewed_by WHERE p.cadet_id=$1 ORDER BY p.activity_date DESC', [cadetId]);
    res.json(result.rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const listAllPhysical = async (_req, res) => {
  try {
    const result = await pool.query(`SELECT p.*, u.name AS cadet_name, r.name AS reviewer_name
      FROM physical_submissions p
      JOIN users u ON u.id = p.cadet_id
      LEFT JOIN users r ON r.id = p.reviewed_by
      ORDER BY CASE WHEN p.review_status = 'pending' THEN 0 ELSE 1 END, p.activity_date DESC, p.created_at DESC`);
    res.json(result.rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getViewUrl = async (req, res) => {
  try {
    const result = await pool.query('SELECT id,cadet_id,storage_key,filename,mime_type FROM physical_submissions WHERE id=$1', [req.params.id]);
    const submission = result.rows[0];
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    if (req.user.role === 'cadet' && submission.cadet_id !== req.user.id) return res.status(403).json({ message: 'Cadets may view only their own submissions' });
    const viewUrl = await storage.createSignedDownload({ bucket: videosBucket(), key: submission.storage_key });
    res.json({ viewUrl, expiresIn: 300, filename: submission.filename, mimeType: submission.mime_type });
  } catch (error) { res.status(503).json({ message: error.message }); }
};

const reviewPhysical = async (req, res) => {
  try {
    const { reviewStatus, comment } = req.body;
    if (!['accepted', 'rejected'].includes(reviewStatus)) return res.status(400).json({ message: 'Review status must be accepted or rejected' });
    const before = await pool.query('SELECT * FROM physical_submissions WHERE id=$1', [req.params.id]);
    if (!before.rows.length) return res.status(404).json({ message: 'Submission not found' });
    const result = await pool.query('UPDATE physical_submissions SET review_status=$1,reviewed_by=$2,reviewed_at=CURRENT_TIMESTAMP,reviewer_comment=$3 WHERE id=$4 RETURNING *', [reviewStatus, req.user.id, comment || null, req.params.id]);
    await writeAudit({ actorId: req.user.id, action: 'physical_submission.reviewed', entityType: 'physical_submission', entityId: req.params.id, before: before.rows[0], after: result.rows[0] });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { requestUpload, completeUpload, listPhysical, listAllPhysical, getViewUrl, reviewPhysical };
