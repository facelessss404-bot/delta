const express = require('express');
const router = express.Router();
const { getLeaves, createLeave, reviewLeave, deleteLeave } = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdminOrCommander, requireCadet } = require('../middleware/roleGuard');

router.get('/', protect, getLeaves);
router.post('/', requireCadet, createLeave);
router.patch('/:id/review', requireAdminOrCommander, reviewLeave);
router.delete('/:id', protect, deleteLeave);

module.exports = router;
