'use strict';

const db = require('../models');
const { generateToken } = require('../utils/generateToken');
const { sendOTPEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');

/**
 * Validation helper functions
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // Password must be at least 6 characters
  return password && password.length >= 6;
};

const validateRole = (role) => {
  const validRoles = ['user', 'admin', 'moderator'];
  return validRoles.includes(role);
};

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * POST /api/auth/register
 * Register a new user
 */
const register = async (req, res) => {
  try {
    // Handle case when body is not parsed
    const body = req.body || {};
    const { name, email, password, phone, role, country, state, city, latitude, longitude } = body;
    const profileImage = req.file ? req.file.filename : null;
    
    // Get backend URL for building full image URL
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const profileImageUrl = req.file ? `${backendUrl}/uploads/profile-images/${req.file.filename}` : null;
    
    // Convert empty strings to null for numeric fields
    const lat = latitude === '' || latitude === undefined ? null : parseFloat(latitude);
    const lng = longitude === '' || longitude === undefined ? null : parseFloat(longitude);

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // Validate password length
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Validate role if provided
    const userRole = role || 'user';
    if (role && !validateRole(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Allowed roles: user, admin, moderator.',
      });
    }

    // Check if user already exists
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists.',
      });
    }

    // Create new user
    const user = await db.User.create({
      name,
      email,
      password,
      phone,
      role: userRole,
      country,
      state,
      city,
      latitude: lat,
      longitude: lng,
      profileImage: profileImageUrl,
    });

    // Generate OTP for email verification
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Save OTP to user record
    await user.update({
      otp: otp,
      otpExpires: otpExpires,
    });

    // Send OTP email
    try {
      await sendOTPEmail(user.email, user.name, otp);
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError);
      // Continue with registration even if email fails
    }

    // Return success but do NOT auto-login - user must verify OTP first
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email with the OTP sent to your email address.',
      data: {
        userId: user.id,
        email: user.email,
        requiresVerification: true,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error.',
        errors: error.errors.map((e) => e.message),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during registration.',
    });
  }
};

/**
 * POST /api/auth/login
 * Authenticate user and return token
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // Find user by email
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      // Generate new OTP for unverified user
      const newOTP = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Save OTP to user record
      user.otp = newOTP;
      user.otpExpires = otpExpires;
      await user.save();
      
      // Send OTP email
      try {
        await sendOTPEmail(user.email, user.name, newOTP);
      } catch (emailError) {
        console.error('Error sending OTP email:', emailError);
      }
      
      return res.status(401).json({
        success: false,
        message: 'Please verify your email address before logging in. A new OTP has been sent to your email.',
        requiresVerification: true,
        email: user.email,
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate token
    const token = generateToken(user);

    // Get backend URL for building full image URL
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    // Convert profileImage path to full URL if exists
    const userData = user.toJSON();
    if (userData.profileImage && !userData.profileImage.startsWith('http')) {
      userData.profileImage = `${backendUrl}/uploads/profile-images/${userData.profileImage}`;
    }

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: userData,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login.',
    });
  }
};

/**
 * GET /api/auth/me
 * Get current user profile
 */
const getMe = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

/**
 * PUT /api/auth/profile
 * Update current user profile
 */
const updateProfile = async (req, res) => {
  try {
    const { name, phone, gotra, nakshatra, country, state, city } = req.body;
    const userId = req.user.id;

    const user = await db.User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Update user fields
    await user.update({
      name: name || user.name,
      phone: phone !== undefined ? phone : user.phone,
      gotra: gotra !== undefined ? gotra : user.gotra,
      nakshatra: nakshatra !== undefined ? nakshatra : user.nakshatra,
      country: country !== undefined ? country : user.country,
      state: state !== undefined ? state : user.state,
      city: city !== undefined ? city : user.city,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

/**
 * POST /api/auth/change-password
 * Change user password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const user = await db.User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    // Update password
    await user.update({ password: newPassword });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

/**
 * POST /api/auth/verify-otp
 * Verify OTP and complete email verification
 */
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required.',
      });
    }

    // Find user by email
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email already verified. You can now login.',
        data: {
          isAlreadyVerified: true,
        },
      });
    }

    // Check if OTP matches
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.',
      });
    }

    // Check if OTP has expired
    if (!user.otpExpires || new Date() > new Date(user.otpExpires)) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.',
      });
    }

    // Clear OTP and mark email as verified
    await user.update({
      otp: null,
      otpExpires: null,
      isEmailVerified: true,
    });

    // Generate token for auto-login after verification
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. Your account is now active.',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during OTP verification.',
    });
  }
};

/**
 * POST /api/auth/resend-otp
 * Resend OTP to user's email
 */
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    // Find user by email
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified. You can login directly.',
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to user record
    await user.update({
      otp: otp,
      otpExpires: otpExpires,
    });

    // Send OTP email
    await sendOTPEmail(user.email, user.name, otp);

    res.status(200).json({
      success: true,
      message: 'OTP has been resent to your email address.',
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while resending OTP.',
    });
  }
};

/**
 * POST /api/auth/forgot-password
 * Send password reset OTP to user's email
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    // Find user by email
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal whether user exists
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset OTP has been sent.',
      });
    }

    // Generate 6-digit OTP for password reset
    const resetOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to user record
    user.resetPasswordToken = resetOTP;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    // Send password reset OTP email
    try {
      await sendPasswordResetEmail(user.email, user.name, resetOTP);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset OTP has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

/**
 * POST /api/auth/reset-password
 * Reset password using OTP
 */
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    // Find user by email
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP.',
      });
    }

    // Check if OTP matches
    if (user.resetPasswordToken !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP.',
      });
    }

    // Check if OTP has expired
    if (!user.resetPasswordExpires || new Date() > new Date(user.resetPasswordExpires)) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new password reset.',
      });
    }

    // Update password and clear reset tokens
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
};
