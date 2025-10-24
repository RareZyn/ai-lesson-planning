// backend/route/answerRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  submitAnswer,
  batchSubmitAnswers,
  getSubmissionById,
  getSubmissionsByAssessment,
  getSubmissionsByClass,
  getAssessmentStats,
  deleteSubmission,
} = require("../controller/answerSubmissionController");

// Apply authentication to all routes
router.use(protect);

// Submission routes
router.post("/submit", submitAnswer); // POST /api/answers/submit
router.post("/batch-submit", batchSubmitAnswers); // POST /api/answers/batch-submit

// Get submissions
router.get("/assessment/:assessmentId/stats", getAssessmentStats); // GET /api/answers/assessment/:assessmentId/stats
router.get("/assessment/:assessmentId", getSubmissionsByAssessment); // GET /api/answers/assessment/:assessmentId
router.get("/class/:classId", getSubmissionsByClass); // GET /api/answers/class/:classId

// Individual submission routes
router
  .route("/:id")
  .get(getSubmissionById) // GET /api/answers/:id
  .delete(deleteSubmission); // DELETE /api/answers/:id

module.exports = router;
