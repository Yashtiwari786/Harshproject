const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const AuditLog = require('../models/AuditLog');
const { generateOTP, hashString } = require('../utils/generateCode');
const { sendOTPEmail } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_lost2found_jwt_key_2026_change_in_production', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc Register User & Send OTP
// @route POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, collegeId, phone, department, year, password } = req.body;

    // Optional email domain check (if configured)
    const requiredDomain = process.env.COLLEGE_EMAIL_DOMAIN ? process.env.COLLEGE_EMAIL_DOMAIN.trim() : '';
    if (requiredDomain && !email.toLowerCase().endsWith(requiredDomain.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Registration requires an official email ending with @${requiredDomain}`,
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists. Please login.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      collegeId,
      phone,
      department,
      year: year || '1st Year',
      passwordHash,
      role: 'STUDENT',
      isEmailVerified: false,
      accountStatus: 'ACTIVE',
    });

    // Generate 6-digit OTP
    const otpCode = generateOTP();
    const otpHash = hashString(otpCode);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await OTP.deleteMany({ email: email.toLowerCase() });
    await OTP.create({
      email: email.toLowerCase(),
      otpHash,
      expiresAt,
    });

    // Send OTP via email (or dev log)
    await sendOTPEmail(email, otpCode);

    await AuditLog.create({
      userId: user._id,
      action: 'USER_REGISTER',
      targetType: 'User',
      targetId: user._id.toString(),
      description: `New user ${name} (${email}) registered. Verification OTP sent.`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! An OTP code has been sent to your college email.',
      data: {
        userId: user._id,
        email: user.email,
        isEmailVerified: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Verify Email OTP
// @route POST /api/auth/verify-otp
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP code are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const otpRecord = await OTP.findOne({ email: email.toLowerCase() });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP has expired or is invalid. Please request a new one.' });
    }

    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: 'Maximum verification attempts exceeded. Please request a new OTP.' });
    }

    const hashedInput = hashString(otp);
    if (hashedInput !== otpRecord.otpHash) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ success: false, message: `Invalid OTP code. ${5 - otpRecord.attempts} attempts remaining.` });
    }

    // OTP Verified successfully!
    user.isEmailVerified = true;
    await user.save();

    await OTP.deleteOne({ _id: otpRecord._id });

    const token = generateToken(user._id);

    await createNotification({
      userId: user._id,
      title: 'Email Verified Successfully',
      message: 'Welcome to Lost2Found! Your college account is fully verified.',
      type: 'EMAIL_VERIFIED',
    });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You are now logged in.',
      token,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        collegeId: user.collegeId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Resend OTP Code
// @route POST /api/auth/resend-otp
const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'User account not found.' });

    const existingOtp = await OTP.findOne({ email: email.toLowerCase() });
    if (existingOtp) {
      const cooldownMs = 60 * 1000; // 1 minute cooldown
      const timeElapsed = Date.now() - new Date(existingOtp.lastSentAt).getTime();
      if (timeElapsed < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - timeElapsed) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSeconds} seconds before requesting another OTP.`,
        });
      }
    }

    const otpCode = generateOTP();
    const otpHash = hashString(otpCode);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.deleteMany({ email: email.toLowerCase() });
    await OTP.create({
      email: email.toLowerCase(),
      otpHash,
      expiresAt,
      lastSentAt: Date.now(),
    });

    await sendOTPEmail(email, otpCode);

    res.status(200).json({
      success: true,
      message: 'A fresh OTP verification code has been sent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc Login User
// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.accountStatus === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended by campus administration.' });
    }

    const token = generateToken(user._id);

    await AuditLog.create({
      userId: user._id,
      action: 'USER_LOGIN',
      targetType: 'User',
      targetId: user._id.toString(),
      description: `User ${user.email} logged in.`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        collegeId: user.collegeId,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Logout User
// @route POST /api/auth/logout
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

// @desc Get Current User Profile
// @route GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyOTP,
  resendOTP,
  login,
  logout,
  getMe,
};
