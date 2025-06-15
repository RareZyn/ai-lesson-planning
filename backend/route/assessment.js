// backend/route/assessment.js - Fixed assessment routes
const express = require("express");
const router = express.Router();

// Import controllers
const {
  generateActivityAndRubric,
  fullLessonPlanner,
  generateEssayAssessment,
  generateTextbookActivity,
  saveAssessment,
  getUserAssessments,
  getAssessmentById,
  deleteAssessment,
} = require("../controller/aseessmentController");

// Import middleware
const { protect } = require("../middleware/auth");

// Apply authentication middleware to all routes
router.use(protect);

// Route definitions
router.post("/fullLessonPlanner", fullLessonPlanner);
router.post("/generateActivityAndRubric", generateActivityAndRubric);
router.post("/generateEssayAssessment", generateEssayAssessment);
router.post("/generateTextbookActivity", generateTextbookActivity);

// Assessment CRUD operations
router.post("/save", saveAssessment);
router.get("/my-assessments", getUserAssessments);
router.get("/:id", getAssessmentById);
router.delete("/:id", deleteAssessment);

module.exports = router;
