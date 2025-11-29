const express = require("express");
const {
  generateTeacherRegistrationToken,
  getPendingLessons,
  getTeachersBySchool,
  uploadSyllabus,
  getSyllabuses,
  getSyllabusById,
  deleteSyllabus,
  updateSyllabus
} = require("../controller/adminController");
const { protect, authorize } = require("../middleware/auth");
const multer = require("multer");
const upload = multer();

const router = express.Router();

// Apply authentication and authorization to all routes
router
  .use(protect)
  .use(authorize(
    "school_admin",
    "super_admin",
    "principal",
    "math_head",
    "english_head",
    "science_head"
  ));

// Teacher token generation
router.post(
  "/generate-teacher-token",
  generateTeacherRegistrationToken
);

// Teachers management
router.get(
  "/teachers",
  getTeachersBySchool
);

// Syllabus management routes
router.route("/syllabuses")
  .get(getSyllabuses)                          // GET all syllabuses
  .post(upload.single('file'), uploadSyllabus); // POST new syllabus

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