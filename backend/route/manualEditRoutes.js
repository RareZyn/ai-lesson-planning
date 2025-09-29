// backend/route/manualEditRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  editExtractedText,
  adjustScore,
  bulkEditAnswers,
  resetAdjustments,
  getEditHistory,
} = require("../controller/manualEditController");

// Apply authentication to all routes
router.use(protect);

// Manual edit routes
router.put("/:submissionId/edit-text/:questionNumber", editExtractedText); // PUT /api/manual-edit/:submissionId/edit-text/:questionNumber
router.put("/:submissionId/adjust-score/:questionNumber", adjustScore); // PUT /api/manual-edit/:submissionId/adjust-score/:questionNumber
router.put("/:submissionId/bulk-edit", bulkEditAnswers); // PUT /api/manual-edit/:submissionId/bulk-edit
router.put("/:submissionId/reset/:questionNumber", resetAdjustments); // PUT /api/manual-edit/:submissionId/reset/:questionNumber
router.get("/:submissionId/edit-history", getEditHistory); // GET /api/manual-edit/:submissionId/edit-history

module.exports = router;
