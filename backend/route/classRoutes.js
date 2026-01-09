const express = require('express');
const {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getClassesByYear,
  getClassesBySubject,
  getRecentClasses,
  getClassesByGrade,
} = require('../controller/classController');
const { protect, checkPermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

// Apply authentication middleware to all routes in this file
router.use(protect);


// --- Specific routes first ---
router.get('/recent', checkPermission(PERMISSIONS.CLASS_READ), getRecentClasses);
router.get('/year/:year', checkPermission(PERMISSIONS.CLASS_READ), getClassesByYear);
router.get('/subject/:subject', checkPermission(PERMISSIONS.CLASS_READ), getClassesBySubject);
router.get('/grade/:grade', checkPermission(PERMISSIONS.CLASS_READ), getClassesByGrade);


// --- Routes for the base path '/' ---
router.route('/')
  .get(checkPermission(PERMISSIONS.CLASS_READ), getClasses)
  .post(checkPermission(PERMISSIONS.CLASS_CREATE), createClass);


// --- Generic wildcard routes last ---
router.route('/:id')
  .get(checkPermission(PERMISSIONS.CLASS_READ), getClassById)
  .put(checkPermission(PERMISSIONS.CLASS_UPDATE), updateClass)
  .delete(checkPermission(PERMISSIONS.CLASS_DELETE), deleteClass);


module.exports = router;