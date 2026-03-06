'use strict';

const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user
 * @param {Object} user - User object containing id, email, and role
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET || 'jainverse-secret-key-2026',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );

  return token;
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token or null if invalid
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET || 'jainverse-secret-key-2026'
    );
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
