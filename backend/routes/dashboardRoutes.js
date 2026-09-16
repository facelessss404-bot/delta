const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getCommanderDashboard, getAdminDashboard, getCadetDashboard } = require('../controllers/dashboardController');

const router = express.Router();
router.get('/commander', protect, authorize('commander'), getCommanderDashboard);
router.get('/admin', protect, authorize('admin', 'commander'), getAdminDashboard);
router.get('/cadet', protect, authorize('cadet'), getCadetDashboard);
module.exports = router;
