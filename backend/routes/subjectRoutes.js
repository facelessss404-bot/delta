const express = require('express');
const router = express.Router();
const { getSubjects, createSubject, updateSubject, deleteSubject } = require('../controllers/subjectController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getSubjects)
  .post(protect, authorize('admin', 'commander'), createSubject);

router.route('/:id')
  .patch(protect, authorize('admin', 'commander'), updateSubject)
  .delete(protect, authorize('commander'), deleteSubject);

module.exports = router;
