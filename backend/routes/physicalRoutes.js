const express = require('express');
const router = express.Router();
const {
  presignUpload,
  completeUpload,
  getMySubmissions,
  getAllSubmissions,
  getCadetSubmissions,
  reviewSubmission,
  getViewUrl,
  handleLocalUpload
} = require('../controllers/physicalController');
const { protect, authorize, enforceCadetOwnership } = require('../middleware/authMiddleware');

router.post('/presign', protect, presignUpload);
router.post('/complete', protect, completeUpload);
router.get('/my', protect, getMySubmissions);
router.get('/', protect, authorize('admin', 'commander'), getAllSubmissions);
router.get('/cadet/:cadetId', protect, enforceCadetOwnership, getCadetSubmissions);
router.patch('/:id/review', protect, authorize('admin', 'commander'), reviewSubmission);
router.get('/:id/view-url', protect, getViewUrl);

// Endpoint for local binary PUT upload during development
router.put('/local-upload/:key', handleLocalUpload);

module.exports = router;
