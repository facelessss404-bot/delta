const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');

const { protect, authorize } = require('../middleware/authMiddleware');

// POST /api/counselling-registrations (public)
router.post('/', registrationController.registerCounselling);

// GET /api/counselling-registrations (admin/commander)
router.get('/', protect, authorize('admin', 'commander'), registrationController.getRegistrations);

module.exports = router;
