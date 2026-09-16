const express = require('express');
const router = express.Router();
const { getExams, createExam } = require('../controllers/examController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdminOrCommander } = require('../middleware/roleGuard');

router.get('/', protect, getExams);
router.post('/', requireAdminOrCommander, createExam);
module.exports = router;
