'use strict';

const db = require('../models');

/**
 * GET /api/admin/dashboard
 * Get admin dashboard data
 */
const getDashboard = async (req, res) => {
  try {
    const totalUsers = await db.User.count();
    const totalBusinesses = await db.Business.count();
    const activeUsers = await db.User.count({ where: { isActive: true } });
    const activeBusinesses = await db.Business.count({ where: { isActive: true } });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalBusinesses,
        activeUsers,
        activeBusinesses,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await db.User.findAll({
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires', 'verificationToken'] },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: {
        users,
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

/**
 * PUT /api/admin/users/:id/role
 * Update user role (admin only)
 */
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['user', 'admin', 'moderator'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role.',
      });
    }

    const user = await db.User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    await user.update({ role });

    res.status(200).json({
      success: true,
      message: 'User role updated successfully.',
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

/**
 * PUT /api/admin/users/:id/status
 * Toggle user active status (admin only)
 */
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await db.User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    await user.update({ isActive: !user.isActive });

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

module.exports = {
  getDashboard,
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
};
