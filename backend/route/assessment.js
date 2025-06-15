// backend/route/assessment.js - Updated with authentication middleware
const express = require("express");
const {
  fullLessonPlanner,
  generateActivityAndRubric,
  generateEssayAssessment,
  generateTextbookActivity,
  saveAssessment,
  getUserAssessments,
  getAssessmentById,
  deleteAssessment,
  updateAssessment,
} = require("../controller/aseessmentController");

// Import authentication middleware
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Lesson-based assessment generation endpoints (require auth)
router.post("/fullLessonPlanner", protect, fullLessonPlanner);
router.post("/generateActivityAndRubric", protect, generateActivityAndRubric);
router.post("/generateEssayAssessment", protect, generateEssayAssessment);
router.post("/generateTextbookActivity", protect, generateTextbookActivity);

// Assessment CRUD operations (all require auth)
router.post("/save", protect, saveAssessment);
router.get("/my-assessments", protect, getUserAssessments);
router.get("/:id", protect, getAssessmentById);
router.put("/:id", protect, updateAssessment);
router.delete("/:id", protect, deleteAssessment);

module.exports = router;
