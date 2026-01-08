const express = require("express");
const {
  generateTeacherRegistrationToken,
  getPendingLessons,
  getTeachersBySchool,
  uploadSyllabus,
  getSyllabuses,
  getSyllabusById,
  deleteSyllabus,
  updateSyllabus,
  getTeacherAnalytics,
  extractSyllabusData,
  getActiveTokens,
  deleteTeacher,
  inviteTeacher,
  toggleTeacherStatus,
  revokeToken,
  resendInvite,
  updateTeacherRole,
  getAuditLogs
} = require("../controller/adminController");
const { protect, checkPermission } = require("../middleware/auth");
const { PERMISSIONS } = require("../config/permissions");
const multer = require("multer");
const upload = multer();

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Teachers management
router.get(
  "/teachers",
  checkPermission(PERMISSIONS.USER_READ),
  getTeachersBySchool
);

router.delete(
  "/teachers/:id",
  checkPermission(PERMISSIONS.USER_DELETE),
  deleteTeacher
);

router.put(
  "/teachers/:id/status",
  checkPermission(PERMISSIONS.USER_UPDATE),
  toggleTeacherStatus
);

router.put(
  "/teachers/:id/role",
  checkPermission(PERMISSIONS.USER_UPDATE),
  updateTeacherRole
);

// Teacher token generation
router.post(
  "/generate-teacher-token",
  checkPermission(PERMISSIONS.USER_CREATE),
  generateTeacherRegistrationToken
);

router.get("/tokens/active", checkPermission(PERMISSIONS.TOKEN_READ), getActiveTokens);

router.delete("/tokens/:id", checkPermission(PERMISSIONS.TOKEN_DELETE), revokeToken);

router.post("/tokens/:id/resend", checkPermission(PERMISSIONS.TOKEN_UPDATE), resendInvite);

router.post("/invite", checkPermission(PERMISSIONS.USER_CREATE), inviteTeacher);

router.get("/audit-logs", checkPermission(PERMISSIONS.AUDIT_LOG_READ), getAuditLogs);

router.get("/teachers/:id/analytics", checkPermission(PERMISSIONS.USER_READ), getTeacherAnalytics);

// AI Syllabus Extraction Route
router.post(
  "/syllabuses/extract-data",
  upload.single('file'),
  // checkPermission(PERMISSIONS.SYLLABUS_MANAGE), // TODO: Add specific permission if needed, currently reusing ADMIN_DASHBOARD or similar?
  // Actually, syllabuses are material/curriculum. Admin usually manages these.
  checkPermission(PERMISSIONS.ADMIN_DASHBOARD),
  extractSyllabusData
);

// Syllabus management routes
router.route("/syllabuses")
  .get(checkPermission(PERMISSIONS.LESSON_READ), getSyllabuses)
  .post(checkPermission(PERMISSIONS.SCHOOL_SETTINGS), uploadSyllabus);

router.route("/syllabuses/:id")
  .get(checkPermission(PERMISSIONS.SCHOOL_SETTINGS), getSyllabusById)
  .put(checkPermission(PERMISSIONS.SCHOOL_SETTINGS), upload.single('file'), updateSyllabus)
  .delete(checkPermission(PERMISSIONS.SCHOOL_SETTINGS), deleteSyllabus);

// Legacy route (for backward compatibility if needed)
router.post(
  "/upload-syllabus",
  upload.single('file'),
  checkPermission(PERMISSIONS.SCHOOL_SETTINGS),
  uploadSyllabus
);

module.exports = router;