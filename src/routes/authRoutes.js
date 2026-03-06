'use strict';

const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profile-images');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter to only allow image files
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * Public routes (no authentication required)
 */

// POST /api/auth/register - Register a new user (with optional profile image)
// Using upload.none() as middleware to parse multipart form data, then handle file separately
router.post('/register', (req, res, next) => {
  upload.single('profileImage')(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    // Continue to controller
    authController.register(req, res);
  });
});

// POST /api/auth/login - Login user
router.post('/login', authController.login);

// POST /api/auth/verify-otp - Verify OTP and complete email verification
router.post('/verify-otp', authController.verifyOTP);

// POST /api/auth/resend-otp - Resend OTP to user's email
router.post('/resend-otp', authController.resendOTP);

// POST /api/auth/forgot-password - Send password reset OTP
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/reset-password - Reset password using OTP
router.post('/reset-password', authController.resetPassword);

/**
 * Protected routes (authentication required)
 */

// GET /api/auth/me - Get current user profile
router.get('/me', authenticate, authController.getMe);

// PUT /api/auth/profile - Update user profile
router.put('/profile', authenticate, authController.updateProfile);

// POST /api/auth/change-password - Change password
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;
