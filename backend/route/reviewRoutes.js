// backend/route/reviewRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getSubmissionsForReview,
  markAsReviewed,
  flagForRegrade,
  bulkReview,
  getLowConfidenceAnswers,
  getReviewStatistics,
  exportReviewData,
} = require("../controller/reviewController");

// Apply authentication to all routes
router.use(protect);

// Review routes
router.get("/submissions", getSubmissionsForReview); // GET /api/review/submissions
router.get("/low-confidence", getLowConfidenceAnswers); // GET /api/review/low-confidence
router.get("/statistics", getReviewStatistics); // GET /api/review/statistics
router.get("/export", exportReviewData); // GET /api/review/export

router.put("/:submissionId/mark-reviewed", markAsReviewed); // PUT /api/review/:submissionId/mark-reviewed
router.put("/:submissionId/flag-regrade", flagForRegrade); // PUT /api/review/:submissionId/flag-regrade
router.put("/bulk-review", bulkReview); // PUT /api/review/bulk-review

module.exports = router;
