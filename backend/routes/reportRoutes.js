const express = require('express');
const router = express.Router();
const { getOverviewReport, getCadetReport } = require('../controllers/reportController');
const { protect, authorize, enforceCadetOwnership } = require('../middleware/authMiddleware');

router.get('/overview', protect, authorize('admin', 'commander'), getOverviewReport);
router.get('/cadet/:cadetId', protect, enforceCadetOwnership, getCadetReport);

module.exports = router;
