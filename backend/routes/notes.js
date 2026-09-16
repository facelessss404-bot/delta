const express = require('express');
const router = express.Router();
const { getNotes, uploadNote, deleteNote, downloadNote } = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdminOrCommander } = require('../middleware/roleGuard');
const upload = require('../middleware/upload');

router.get('/', protect, getNotes);
router.post('/', requireAdminOrCommander, upload.single('file'), uploadNote);
router.delete('/:id', protect, deleteNote);
router.get('/:id/download', protect, downloadNote);

module.exports = router;
