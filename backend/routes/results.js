const express = require('express');
const router = express.Router();
const { getResults, getMyResults, upsertResult, deleteResult } = require('../controllers/resultController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdminOrCommander, requireAdmin } = require('../middleware/roleGuard');

router.get('/', requireAdminOrCommander, getResults);
router.get('/me', protect, getMyResults);
router.post('/', requireAdminOrCommander, upsertResult);
router.delete('/:id', requireAdmin, deleteResult);
module.exports = router;
