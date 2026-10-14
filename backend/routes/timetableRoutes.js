const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getSchedules,
  getTimetableSlots,
  getMyTimetable,
  getTodaySchedule,
  createSlot,
  updateSlot,
  deleteSlot
} = require('../controllers/timetableController');

const router = express.Router();

router.get('/schedules', protect, getSchedules);
router.get('/slots', protect, getTimetableSlots);
router.get('/my', protect, getMyTimetable);
router.get('/today', protect, getTodaySchedule);

// Commander & Admin slot management
router.post('/slots', protect, authorize('admin', 'commander'), createSlot);
router.put('/slots/:id', protect, authorize('admin', 'commander'), updateSlot);
router.delete('/slots/:id', protect, authorize('admin', 'commander'), deleteSlot);

module.exports = router;
