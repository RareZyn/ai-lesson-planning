// backend/route/assessment.js - Simplified with unified endpoint
const express = require("express");
const {
  fullLessonPlanner,
  generateFromLessonPlan,
  saveAssessment,
  getUserAssessments,
  getAssessmentById,
  deleteAssessment,
  updateAssessment,
} = require("../controller/aseessmentController");
const { protect, optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/generateFromLessonPlan", protect, generateFromLessonPlan);
router.post("/save", protect, saveAssessment);

// Get user's assessments with filtering and pagination
router.get("/my-assessments", protect, getUserAssessments);

// Get specific assessment by ID
router.get("/:id", protect, getAssessmentById);

// Update assessment
router.put("/:id", protect, updateAssessment);

// Delete assessment
router.delete("/:id", protect, deleteAssessment);

module.exports = router;
