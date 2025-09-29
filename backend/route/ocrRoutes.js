const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  extractTextFromImage,
  batchExtractText,
} = require("../controller/ocrController");

router.use(protect);

// POST /api/ocr/extract - Extract text from single image
router.post("/extract", extractTextFromImage);

// POST /api/ocr/batch - Batch extract text from multiple images
router.post("/batch", batchExtractText);

module.exports = router;
