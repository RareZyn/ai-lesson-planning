const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();

// Import controller functions
const {
  extractTextFromImage,
  extractTextFromFile,
  batchExtractText,
  checkOCRServiceHealth,
} = require("../controller/ocrController");


// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "./uploads/ocr";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(
      null,
      Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Debug: Check if functions are properly imported
console.log("OCR Controller functions:", {
  extractTextFromImage: typeof extractTextFromImage,
  extractTextFromFile: typeof extractTextFromFile,
  batchExtractText: typeof batchExtractText,
  checkOCRServiceHealth: typeof checkOCRServiceHealth,
});

// Routes
// Route: Extract text from base64 image data
router.post("/extract-text", extractTextFromImage);

// Route: Extract text from uploaded file
router.post("/extract-file", upload.single("image"), extractTextFromFile);

// Route: Batch process multiple images
router.post("/batch-extract", batchExtractText);

// Route: Check OCR service health (no auth required)
router.get("/health", checkOCRServiceHealth);

module.exports = router;
