const express = require('express');
const router = express.Router();
const { register, login, getMe, googleLogin, updateProfile, logout } = require('../controllers/authController');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleLogin);
router.get('/me', auth, getMe);
router.put('/update-profile', auth, updateProfile);
router.post('/logout', auth, logout);

module.exports = router;
