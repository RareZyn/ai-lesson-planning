// backend/route/ocrRoutes.js (Enhanced)
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  extractTextFromImage,
  processSubmissionOCR,
  batchProcessOCR,
  getOCRStatus,
  retryFailedOCR,
  processSpmAnswerSheet,
  extractMultiAnswers,
} = require("../controller/ocrController");

// Apply authentication to all routes
router.use(protect);

// Standalone OCR routes
router.post("/extract", extractTextFromImage); // POST /api/ocr/extract

// Multi-Answer Extraction (numbered answer list from single image)
router.post("/extract-multi-answers", extractMultiAnswers); // POST /api/ocr/extract-multi-answers

// SPM Answer Sheet Processing (MCQ bubble detection)
router.post("/process-spm-answer-sheet", processSpmAnswerSheet); // POST /api/ocr/process-spm-answer-sheet

// Submission-based OCR routes
router.post("/process-submission/:submissionId", processSubmissionOCR); // POST /api/ocr/process-submission/:submissionId
router.post("/batch-process", batchProcessOCR); // POST /api/ocr/batch-process
router.get("/status/:submissionId", getOCRStatus); // GET /api/ocr/status/:submissionId
router.post("/retry/:submissionId", retryFailedOCR); // POST /api/ocr/retry/:submissionId

module.exports = router;
