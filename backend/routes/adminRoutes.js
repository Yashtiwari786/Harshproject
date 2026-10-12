const express = require('express');
const router = express.Router();

const {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  updateUserRole,
  getAllItems,
  getAllClaims,
  getAllReports,
  updateReportStatus,
  blockAbuseUser,
  getAuditLogs,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);
router.use(authorize('STAFF', 'ADMIN'));

router.get('/dashboard', getDashboardStats);
router.get('/items', getAllItems);
router.get('/claims', getAllClaims);
router.get('/reports', getAllReports);
router.put('/reports/:id', updateReportStatus);
router.post('/reports/:id/block-user', blockAbuseUser);

// User read-only directory open to both Staff & Admin (for ID inspection during handover)
router.get('/users', getUsers);

// Category & Location getters open to Staff/Admin
router.get('/categories', getCategories);
router.get('/locations', getLocations);

// Admin-only mutating endpoints
router.use(authorize('ADMIN'));
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/role', updateUserRole);
router.get('/audit-logs', getAuditLogs);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);
router.post('/locations', createLocation);
router.put('/locations/:id', updateLocation);
router.delete('/locations/:id', deleteLocation);

module.exports = router;
