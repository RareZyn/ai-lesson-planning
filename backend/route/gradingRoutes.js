// backend/route/gradingRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  scoreSubmission,
  scoreAnswer,
  batchGradeSubmissions,
  getGradingStatus,
} = require("../controller/gradingController");

// Apply authentication to all routes
router.use(protect);

// Grading routes
router.post("/score-submission/:submissionId", scoreSubmission); // POST /api/grading/score-submission/:submissionId
router.post("/score-answer/:submissionId/:questionNumber", scoreAnswer); // POST /api/grading/score-answer/:submissionId/:questionNumber
router.post("/batch-grade", batchGradeSubmissions); // POST /api/grading/batch-grade
router.get("/status/:submissionId", getGradingStatus); // GET /api/grading/status/:submissionId

module.exports = router;
