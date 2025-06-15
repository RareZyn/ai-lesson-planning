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
} = require("../controller/aseessmentController");

// Import authentication middleware


const router = express.Router();


router.post("/fullLessonPlanner", fullLessonPlanner);
router.post("/generateActivityAndRubric", generateActivityAndRubric);
router.post("/generateEssayAssessment", generateEssayAssessment);
router.post("/generateTextbookActivity", generateTextbookActivity);

// NEW: Assessment management routes
router.post("/save", saveAssessment);
router.get("/my-assessments", getUserAssessments);
router.get("/:id", getAssessmentById);
router.delete("/:id", deleteAssessment);

module.exports = router;
