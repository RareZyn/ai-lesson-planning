// backend/route/assessment.js - Simple routes without middleware
const express = require("express");
const {
  fullLessonPlanner,
  generateActivityAndRubric,
  generateEssayAssessment,
  generateTextbookActivity,
  generateAssessment,
  generateFromLessonPlan,
  saveAssessment,
  getUserAssessments,
  getAssessmentById,
  deleteAssessment,
  updateAssessment,
} = require("../controller/aseessmentController");

const router = express.Router();

// =================================
// LESSON-BASED ASSESSMENT GENERATION
// =================================

// Legacy lesson planner endpoint
router.post("/fullLessonPlanner", fullLessonPlanner);

// Individual assessment type generation endpoints
router.post("/generateActivityAndRubric", generateActivityAndRubric);
router.post("/generateEssayAssessment", generateEssayAssessment);
router.post("/generateTextbookActivity", generateTextbookActivity);
router.post("/generateAssessment", generateAssessment);

// Unified lesson plan to assessment generation endpoint
router.post("/generateFromLessonPlan", generateFromLessonPlan);

// =================================
// ASSESSMENT CRUD OPERATIONS
// =================================

// Create/Save assessment
router.post("/save", saveAssessment);

// Get user's assessments with filtering and pagination
router.get("/my-assessments", getUserAssessments);

// Get specific assessment by ID
router.get("/:id", getAssessmentById);

// Update assessment
router.put("/:id", updateAssessment);

// Delete assessment
router.delete("/:id", deleteAssessment);

module.exports = router;
