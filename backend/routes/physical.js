const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { requestUpload, completeUpload, listPhysical, listAllPhysical, getViewUrl, reviewPhysical } = require('../controllers/physicalController');

const router = express.Router();
router.post('/presign', protect, authorize('cadet'), requestUpload);
router.post('/complete', protect, authorize('cadet'), completeUpload);
router.get('/my', protect, authorize('cadet'), listPhysical);
router.get('/', protect, authorize('admin', 'commander'), listAllPhysical);
router.get('/cadet/:cadetId', protect, authorize('admin', 'commander'), listPhysical);
router.get('/:id/view-url', protect, getViewUrl);
router.patch('/:id/review', protect, authorize('admin', 'commander'), reviewPhysical);
module.exports = router;
