const express = require('express');
const router = express.Router();
const { getCadets, getCadetById, createCadet, updateCadet, deleteCadet, getCadetSubjects, replaceCadetSubjects } = require('../controllers/cadetController');
const { protect, authorize, enforceCadetOwnership } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, authorize('admin', 'commander'), getCadets)
  .post(protect, authorize('admin', 'commander'), createCadet);

router.route('/:id')
  .get(protect, enforceCadetOwnership, getCadetById)
  .patch(protect, authorize('admin', 'commander'), updateCadet)
  .delete(protect, authorize('admin', 'commander'), deleteCadet);

router.route('/:id/subjects')
  .get(protect, enforceCadetOwnership, getCadetSubjects)
  .put(protect, authorize('admin', 'commander'), replaceCadetSubjects);

module.exports = router;
