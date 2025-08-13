// backend/route/assessment.js - Add regeneration route
const express = require("express");
const {
  generateFromLessonPlan,
  saveAssessment,
  getUserAssessments,
  getAssessmentById,
  deleteAssessment,
  updateAssessment,
  getLessonPlansWithoutAssessments,
  getUserAssessmentsFiltered,
  regenerateAssessment, // NEW: Add regeneration method
} = require("../controller/aseessmentController");
const { protect, optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/generateFromLessonPlan", protect, generateFromLessonPlan);
router.post("/save", protect, saveAssessment);

// Get user's assessments with filtering and pagination
router.get("/my-assessments", protect, getUserAssessmentsFiltered);

// Get lesson plans without assessments
router.get("/available-lessons", protect, getLessonPlansWithoutAssessments);

// Get specific assessment by ID
router.get("/:id", protect, getAssessmentById);

// Update assessment
router.put("/:id", protect, updateAssessment);

// Regenerate assessment with new configuration
router.put("/:id/regenerate", protect, regenerateAssessment);

// Delete assessment
router.delete("/:id", protect, deleteAssessment);

module.exports = router;
