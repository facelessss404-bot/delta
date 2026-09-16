const express = require('express');
const router = express.Router();
const { getAdmins, createAdmin, deleteAdmin } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin management routes require Training Commander role
router.use(protect, authorize('commander'));

router.get('/', getAdmins);
router.post('/', createAdmin);
router.delete('/:id', deleteAdmin);

module.exports = router;
