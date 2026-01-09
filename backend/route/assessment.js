// backend/route/assessment.js - Enhanced with SPM exam routes
const express = require("express");
const {
  generateFromLessonPlan,
  createStandaloneAssessment,
  getStandaloneAssessments,
  updateStandaloneAssessment,
  deleteStandaloneAssessment,
  saveAssessment,
  getUserAssessments,
  getAssessmentById,
  deleteAssessment,
  updateAssessment,
  getLessonPlansWithoutAssessments,
  getUserAssessmentsFiltered,
  regenerateAssessment,
  getPublicAssessmentsByLessonPlan,
} = require("../controller/assessmentController");
const { protect, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// ==============================================
// PUBLIC ROUTES (No authentication required)
// ==============================================
// Get public assessments for a shared community lesson plan
router.get("/public/by-lesson/:lessonPlanId", getPublicAssessmentsByLessonPlan);

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
// STANDALONE ASSESSMENT ROUTES
// ==============================================
// Create standalone assessment (handles all activity types including SPM)
router.post("/standalone", protect, createStandaloneAssessment);
// Get standalone assessments only
router.get("/standalone", protect, getStandaloneAssessments);
// Update standalone assessment
router.put("/standalone/:id", protect, updateStandaloneAssessment);
// Delete standalone assessment
router.delete("/standalone/:id", protect, deleteStandaloneAssessment);

// ==============================================
// SPM EXAM SPECIFIC ROUTES (NEW)
// ==============================================
// Create standalone SPM exam (alternative endpoint for clarity)
router.post("/spm-exam", protect, createStandaloneAssessment);
// Generate SPM exam from lesson plan (alternative endpoint for clarity)
router.post("/spm-exam/from-lesson", protect, generateFromLessonPlan);

// ==============================================
// GENERAL ASSESSMENT ROUTES
// ==============================================
// Get user's assessments with filtering and pagination (handles all types)
router.get("/my-assessments", protect, getUserAssessmentsFiltered);
// Get specific assessment by ID (works for all activity types)
router.get("/:id", protect, getAssessmentById);
// Update assessment (works for all types)
router.put("/:id", protect, updateAssessment);
// Regenerate assessment with new configuration (works for all types)
router.put("/:id/regenerate", protect, regenerateAssessment);
// Delete assessment (works for all types)
router.delete("/:id", protect, deleteAssessment);

module.exports = router;