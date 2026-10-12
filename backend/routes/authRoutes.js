const express = require('express');
const router = express.Router();
const { register, verifyOTP, resendOTP, login, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const { validate, registerValidationRules, loginValidationRules } = require('../utils/validators');

router.post('/register', authLimiter, validate(registerValidationRules), register);
router.post('/verify-otp', otpLimiter, verifyOTP);
router.post('/resend-otp', otpLimiter, resendOTP);
router.post('/login', authLimiter, validate(loginValidationRules), login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

module.exports = router;
