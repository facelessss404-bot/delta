const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getCurrentUser, logoutUser } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', protect, authorize('admin', 'commander'), registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getCurrentUser);
router.post('/logout', protect, logoutUser);

module.exports = router;
