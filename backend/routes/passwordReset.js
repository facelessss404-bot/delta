const express = require('express');
const router = express.Router();
const { requestReset, executeReset } = require('../controllers/passwordResetController');

router.post('/forgot-password', requestReset);
router.post('/reset-password', executeReset);

module.exports = router;
