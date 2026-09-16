const router = require('express').Router(); const { protect } = require('../middleware/authMiddleware'); const { listNotifications, markRead } = require('../controllers/notificationController');
router.get('/', protect, listNotifications); router.patch('/:id/read', protect, markRead); module.exports = router;
