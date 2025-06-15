const express = require("express");
const {
  fullLessonPlanner,
  generateActivityAndRubric,
  generateEssayAssessment,
  generateTextbookActivity,
} = require("../controller/aseessmentController");

const router = express.Router();

router.post("/fullLessonPlanner", fullLessonPlanner);
router.post("/generateActivityAndRubric", generateActivityAndRubric);
router.post("/generateEssayAssessment", generateEssayAssessment);
router.post("/generateTextbookActivity", generateTextbookActivity);
module.exports = router;
