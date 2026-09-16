const express = require('express');
const router = express.Router();
const { getNotices, createNotice, updateNotice, deleteNotice } = require('../controllers/noticeController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdminOrCommander, requireAdmin } = require('../middleware/roleGuard');

router.get('/', protect, getNotices);
router.post('/', requireAdminOrCommander, createNotice);
router.put('/:id', requireAdminOrCommander, updateNotice);
router.delete('/:id', requireAdminOrCommander, deleteNotice);

module.exports = router;
