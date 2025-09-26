const axios = require("axios");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

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
    fileSize: 50 * 1024 * 1024, // 50MB limit (increase from 10MB)
  },
});

// OCR service URL
const ocrServiceUrl = process.env.OCR_SERVICE_URL || "http://localhost:5001";

// Extract text from single image
const extractTextFromImage = async (req, res) => {
  try {
    const { image, preprocess = true } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "No image data provided",
      });
    }

    // Call Python OCR service
    const response = await axios.post(`${ocrServiceUrl}/api/ocr/extract`, {
      image: image,
      preprocess: preprocess,
    });

    if (response.data.success) {
      // Save OCR result to database if needed
      // await saveOCRResult(req.user?.id, response.data.data);

      return res.json({
        success: true,
        data: {
          extractedText: response.data.data.text,
          confidence: response.data.data.confidence,
          words: response.data.data.words,
          boundingBoxes: response.data.data.bounding_boxes,
        },
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "OCR processing failed",
        error: response.data.error,
      });
    }
  } catch (error) {
    console.error("OCR Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to process image",
      error: error.message,
    });
  }
};

// Extract text from uploaded file
const extractTextFromFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const filePath = req.file.path;

    // Convert file to base64
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = `data:${
      req.file.mimetype
    };base64,${imageBuffer.toString("base64")}`;

    // Call OCR service
    const response = await axios.post(`${ocrServiceUrl}/api/ocr/extract`, {
      image: base64Image,
      preprocess: req.body.preprocess !== "false",
    });

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    if (response.data.success) {
      return res.json({
        success: true,
        data: {
          extractedText: response.data.data.text,
          confidence: response.data.data.confidence,
          words: response.data.data.words,
          boundingBoxes: response.data.data.bounding_boxes,
          originalFileName: req.file.originalname,
        },
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "OCR processing failed",
        error: response.data.error,
      });
    }
  } catch (error) {
    console.error("File OCR Error:", error.message);

    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message: "Failed to process uploaded file",
      error: error.message,
    });
  }
};

// Batch process multiple images
const batchExtractText = async (req, res) => {
  try {
    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images provided or invalid format",
      });
    }

    // Call Python OCR service for batch processing
    const response = await axios.post(
      `${ocrServiceUrl}/api/ocr/batch-extract`,
      {
        images: images,
      }
    );

    if (response.data.success) {
      return res.json({
        success: true,
        data: response.data.data.map((result) => ({
          extractedText: result.text,
          confidence: result.confidence,
          words: result.words,
          boundingBoxes: result.bounding_boxes,
        })),
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Batch OCR processing failed",
        error: response.data.error,
      });
    }
  } catch (error) {
    console.error("Batch OCR Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to process images",
      error: error.message,
    });
  }
};

// Check OCR service health
const checkOCRServiceHealth = async (req, res) => {
  try {
    const response = await axios.get(`${ocrServiceUrl}/health`);
    return res.json({
      success: true,
      serviceStatus: response.data,
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: "OCR service is unavailable",
      error: error.message,
    });
  }
};

// Save OCR result to database (optional)
const saveOCRResult = async (userId, ocrData) => {
  try {
    // Implement database saving logic here if needed
    // const ocrResult = new OCRResult({
    //   userId: userId,
    //   extractedText: ocrData.text,
    //   confidence: ocrData.confidence,
    //   timestamp: new Date()
    // });
    // await ocrResult.save();
  } catch (error) {
    console.error("Error saving OCR result:", error);
  }
};

module.exports = {
  extractTextFromImage,
  extractTextFromFile,
  batchExtractText,
  checkOCRServiceHealth,
  upload,
};
