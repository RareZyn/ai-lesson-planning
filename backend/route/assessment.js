// backend/route/assessment.js - FIXED import path
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
} = require("../controller/aseessmentController");
const { protect, optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/generateFromLessonPlan", protect, generateFromLessonPlan);
router.post("/save", protect, saveAssessment);

// Get user's assessments with filtering and pagination
router.get("/my-assessments", protect, getUserAssessmentsFiltered);

// NEW: Get lesson plans without assessments
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