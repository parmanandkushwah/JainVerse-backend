'use strict';

const jwt = require('jsonwebtoken');
const db = require('../models');

/**
 * Middleware to authenticate user using JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'jainverse-secret-key-2026'
      );

      // Fetch user from database to get latest data
      const user = await db.User.findByPk(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found.',
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated.',
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

/**
 * Middleware to check if user has required role(s)
 * @param {string|string[]} roles - Allowed roles (can be single role or array)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const userRole = req.user.role;

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is an admin
 */
const requireAdmin = (req, res, next) => {
  return authorize('admin')(req, res, next);
};

/**
 * Middleware to check if user is an admin or moderator
 */
const requireAdminOrModerator = (req, res, next) => {
  return authorize('admin', 'moderator')(req, res, next);
};

module.exports = {
  authenticate,
  authorize,
  requireAdmin,
  requireAdminOrModerator,
};
