// backend/route/assessment.js - Updated with additional routes
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

const router = express.Router();

router.post("/fullLessonPlanner", fullLessonPlanner);
router.post("/generateActivityAndRubric", generateActivityAndRubric);
router.post("/generateEssayAssessment", generateEssayAssessment);
router.post("/generateTextbookActivity", generateTextbookActivity);

router.post("/save", saveAssessment);
router.get("/my-assessments", getUserAssessments);
router.get("/:id", getAssessmentById);
router.put("/:id", updateAssessment);
router.delete("/:id", deleteAssessment);

module.exports = router;
