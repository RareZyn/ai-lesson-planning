// backend/route/assessment.js - Enhanced with standalone assessment routes
const express = require("express");
const {
  generateFromLessonPlan,
  createStandaloneAssessment, // NEW
  getStandaloneAssessments, // NEW
  updateStandaloneAssessment, // NEW
  deleteStandaloneAssessment, // NEW
  saveAssessment,
  getUserAssessments,
  getAssessmentById,
  deleteAssessment,
  updateAssessment,
  getLessonPlansWithoutAssessments,
  getUserAssessmentsFiltered,
  regenerateAssessment,
} = require("../controller/aseessmentController");
const { protect, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// ==============================================
// LESSON-BASED ASSESSMENT ROUTES
// ==============================================
// Generate assessment from lesson plan (can handle both lesson-based and standalone)
router.post("/generateFromLessonPlan", protect, generateFromLessonPlan);
// Save assessment manually
router.post("/save", protect, saveAssessment);
// Get lesson plans without assessments
router.get("/available-lessons", protect, getLessonPlansWithoutAssessments);

// ==============================================
// STANDALONE ASSESSMENT ROUTES (NEW)
// ==============================================
// Create standalone assessment
router.post("/standalone", protect, createStandaloneAssessment);
// Get standalone assessments only
router.get("/standalone", protect, getStandaloneAssessments);
// Update standalone assessment
router.put("/standalone/:id", protect, updateStandaloneAssessment);
// Delete standalone assessment
router.delete("/standalone/:id", protect, deleteStandaloneAssessment);

// ==============================================
// GENERAL ASSESSMENT ROUTES
// ==============================================
// Get user's assessments with filtering and pagination (handles both types)
router.get("/my-assessments", protect, getUserAssessmentsFiltered);
// Get specific assessment by ID (works for both lesson-based and standalone)
router.post("/spm-exam", protect, createStandaloneAssessment);
router.get("/:id", protect, getAssessmentById);
// Update assessment (works for both types)
router.put("/:id", protect, updateAssessment);
// Regenerate assessment with new configuration (works for both types)
router.put("/:id/regenerate", protect, regenerateAssessment);
// Delete assessment (works for both types)
router.delete("/:id", protect, deleteAssessment);

module.exports = router;
