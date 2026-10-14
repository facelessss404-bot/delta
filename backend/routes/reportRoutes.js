const express = require('express');
const router = express.Router();
const { getOverviewReport, getCadetReport } = require('../controllers/reportController');
const {
  exportAttendance,
  exportCadets,
  exportAcademics,
  exportPhysical,
  exportLeaves,
  exportTimetable,
  exportRegistrations
} = require('../controllers/exportController');
const { protect, authorize, enforceCadetOwnership } = require('../middleware/authMiddleware');

router.get('/overview', protect, authorize('admin', 'commander'), getOverviewReport);
router.get('/cadet/:cadetId', protect, enforceCadetOwnership, getCadetReport);

// Data Export Routes (Staff Only)
router.get('/export/attendance', protect, authorize('admin', 'commander'), exportAttendance);
router.get('/export/cadets', protect, authorize('admin', 'commander'), exportCadets);
router.get('/export/academics', protect, authorize('admin', 'commander'), exportAcademics);
router.get('/export/physical', protect, authorize('admin', 'commander'), exportPhysical);
router.get('/export/leaves', protect, authorize('admin', 'commander'), exportLeaves);
router.get('/export/timetable', protect, authorize('admin', 'commander'), exportTimetable);
router.get('/export/registrations', protect, authorize('admin', 'commander'), exportRegistrations);

module.exports = router;
