const express = require('express');
const router = express.Router();
const { register, login, getMe, googleLogin, updateProfile } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', auth, getMe);
router.put('/update-profile', auth, updateProfile);

module.exports = router;
