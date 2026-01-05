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
const { protect, authorize } = require("../middleware/auth");
const multer = require("multer");
const upload = multer();

const router = express.Router();

// Apply authentication and authorization to all routes
router
  .use(protect)
  .use(authorize(
    "admin",
    "super_admin",
    "math_head",
    "english_head",
    "science_head",
    "teacher"
  ));

// Teachers management
router.get(
  "/teachers",
  getTeachersBySchool
);

router.delete(
  "/teachers/:id",
  deleteTeacher
);

router.put(
  "/teachers/:id/status",
  toggleTeacherStatus
);

router.put(
  "/teachers/:id/role",
  updateTeacherRole
);

// Teacher token generation
router.post(
  "/generate-teacher-token",
  generateTeacherRegistrationToken
);

router.get("/tokens/active", getActiveTokens);

router.delete("/tokens/:id", revokeToken);

router.post("/tokens/:id/resend", resendInvite);

router.post("/invite", inviteTeacher);

router.get("/audit-logs", getAuditLogs);

router.get("/teachers/:id/analytics", getTeacherAnalytics);

// AI Syllabus Extraction Route
router.post(
  "/syllabuses/extract-data",
  upload.single('file'),
  extractSyllabusData
);

// Syllabus management routes
router.route("/syllabuses")
  .get(getSyllabuses)                        // GET all syllabuses
  .post(uploadSyllabus);                       // POST new syllabus (JSON)

router.route("/syllabuses/:id")
  .get(getSyllabusById)                         // GET single syllabus
  .put(upload.single('file'), updateSyllabus)   // UPDATE syllabus
  .delete(deleteSyllabus);                      // DELETE syllabus

// Legacy route (for backward compatibility if needed)
router.post(
  "/upload-syllabus",
  upload.single('file'),
  uploadSyllabus
);

module.exports = router;