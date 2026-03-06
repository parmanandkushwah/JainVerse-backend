'use strict';

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

/**
 * All admin routes require authentication and admin role
 */
router.use(authenticate);
router.use(authorize('admin'));

// GET /api/admin/dashboard - Get admin dashboard
router.get('/dashboard', adminController.getDashboard);

// GET /api/admin/users - Get all users
router.get('/users', adminController.getAllUsers);

// PUT /api/admin/users/:id/role - Update user role
router.put('/users/:id/role', adminController.updateUserRole);

// PUT /api/admin/users/:id/status - Toggle user status
router.put('/users/:id/status', adminController.toggleUserStatus);

module.exports = router;
