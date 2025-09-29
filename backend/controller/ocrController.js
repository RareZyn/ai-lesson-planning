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
    fileSize: 20 * 1024 * 1024, // Reduced to 20MB for faster processing
  },
});

// OCR service URL
const ocrServiceUrl = process.env.OCR_SERVICE_URL || "http://localhost:5001";

// Create axios instance with optimized settings
const ocrAxios = axios.create({
  timeout: 300000, // 5 minutes timeout
  headers: {
    "Content-Type": "application/json",
  },
  maxContentLength: 50 * 1024 * 1024, // 50MB
  maxBodyLength: 50 * 1024 * 1024, // 50MB
});

// Add request interceptor for logging
ocrAxios.interceptors.request.use(
  (config) => {
    console.log(`🚀 OCR Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("❌ OCR Request Error:", error.message);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
ocrAxios.interceptors.response.use(
  (response) => {
    console.log(`✅ OCR Response: ${response.status} (${response.config.url})`);
    return response;
  },
  (error) => {
    console.error(
      `❌ OCR Response Error: ${error.response?.status || "Network Error"} (${
        error.config?.url
      })`
    );
    return Promise.reject(error);
  }
);

// Helper function to compress base64 image if needed
const compressImageIfNeeded = (base64Image, maxSizeKB = 2048) => {
  try {
    // Calculate approximate size in KB
    const sizeKB = (base64Image.length * 3) / 4 / 1024;

    if (sizeKB > maxSizeKB) {
      console.log(
        `📏 Image size ${sizeKB.toFixed(
          1
        )}KB exceeds ${maxSizeKB}KB, may need compression`
      );
      // Note: Actual compression would require image processing here
      // For now, just log the warning
    }

    return base64Image;
  } catch (error) {
    console.error("Error checking image size:", error);
    return base64Image;
  }
};

// Extract text from single image
const extractTextFromImage = async (req, res) => {
  const startTime = Date.now();

  try {
    console.log("📨 Received OCR extraction request");
    const { image, preprocess = true } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "No image data provided",
      });
    }

    // Compress image if needed
    const processedImage = compressImageIfNeeded(image);

    console.log(`🔧 Processing settings: preprocess=${preprocess}`);

    // Call Python OCR service with enhanced error handling
    const response = await ocrAxios.post(`${ocrServiceUrl}/api/ocr/extract`, {
      image: processedImage,
      preprocess: preprocess,
    });

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️  Total processing time: ${processingTime}s`);

    if (response.data.success) {
      console.log(
        `✅ OCR Success: extracted ${response.data.data.text.length} characters`
      );

      return res.json({
        success: true,
        data: {
          extractedText: response.data.data.text,
          confidence: response.data.data.confidence,
          words: response.data.data.words,
          boundingBoxes: response.data.data.bounding_boxes,
          processingTime: processingTime,
        },
      });
    } else {
      console.error("❌ OCR service returned error:", response.data.error);
      return res.status(500).json({
        success: false,
        message: "OCR processing failed",
        error: response.data.error,
      });
    }
  } catch (error) {
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ OCR Error after ${processingTime}s:`, error.message);

    let errorMessage = "Failed to process image";
    let statusCode = 500;

    if (error.code === "ECONNRESET" || error.code === "ECONNABORTED") {
      errorMessage = `Processing timed out after ${processingTime}s. The image may be too complex or the service is overloaded. Try with a smaller image or enable preprocessing.`;
      statusCode = 408;
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      errorMessage =
        "OCR service is not available. Please ensure the Python service is running on port 5001.";
      statusCode = 503;
    } else if (error.response?.status === 408) {
      errorMessage = "Request timed out. Please try with a smaller image.";
      statusCode = 408;
    } else if (error.response?.status === 503) {
      errorMessage = "OCR service is temporarily unavailable.";
      statusCode = 503;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
      statusCode = error.response.status;
    }

    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message,
      processingTime: processingTime,
      suggestions: [
        "Try with a smaller image (< 2MB)",
        "Enable preprocessing for handwritten text",
        "Ensure the Python OCR service is running",
        "Check if system has enough memory available",
      ],
    });
  }
};

// Extract text from uploaded file
const extractTextFromFile = async (req, res) => {
  const startTime = Date.now();

  try {
    console.log("📁 Received file upload OCR request");

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const filePath = req.file.path;
    console.log(
      `📂 Processing file: ${req.file.originalname} (${(
        req.file.size /
        1024 /
        1024
      ).toFixed(2)}MB)`
    );

    // Convert file to base64
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = `data:${
      req.file.mimetype
    };base64,${imageBuffer.toString("base64")}`;

    // Compress if needed
    const processedImage = compressImageIfNeeded(base64Image);

    // Call OCR service
    const response = await ocrAxios.post(`${ocrServiceUrl}/api/ocr/extract`, {
      image: processedImage,
      preprocess: req.body.preprocess !== "false",
    });

    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath);
      console.log("🗑️  Cleaned up temporary file");
    } catch (cleanupError) {
      console.warn("⚠️  Could not clean up file:", cleanupError.message);
    }

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️  File processing time: ${processingTime}s`);

    if (response.data.success) {
      console.log(
        `✅ File OCR Success: extracted ${response.data.data.text.length} characters`
      );

      return res.json({
        success: true,
        data: {
          extractedText: response.data.data.text,
          confidence: response.data.data.confidence,
          words: response.data.data.words,
          boundingBoxes: response.data.data.bounding_boxes,
          originalFileName: req.file.originalname,
          processingTime: processingTime,
        },
      });
    } else {
      console.error("❌ File OCR service error:", response.data.error);
      return res.status(500).json({
        success: false,
        message: "OCR processing failed",
        error: response.data.error,
      });
    }
  } catch (error) {
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ File OCR Error after ${processingTime}s:`, error.message);

    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log("🗑️  Cleaned up temporary file after error");
      } catch (cleanupError) {
        console.warn(
          "⚠️  Could not clean up file after error:",
          cleanupError.message
        );
      }
    }

    let errorMessage = "Failed to process uploaded file";
    let statusCode = 500;

    if (error.code === "ECONNRESET" || error.code === "ECONNABORTED") {
      errorMessage = `File processing timed out after ${processingTime}s. Try with a smaller image file.`;
      statusCode = 408;
    } else if (error.response?.status === 503) {
      errorMessage = "OCR service is temporarily unavailable.";
      statusCode = 503;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
      statusCode = error.response.status;
    }

    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message,
      processingTime: processingTime,
    });
  }
};

// Batch process multiple images
const batchExtractText = async (req, res) => {
  const startTime = Date.now();

  try {
    console.log("📊 Received batch OCR request");
    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images provided or invalid format",
      });
    }

    console.log(`📊 Processing ${images.length} images in batch`);

    // Process images with smaller batches to prevent memory issues
    const batchSize = 3; // Process 3 images at a time
    const results = [];

    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      console.log(
        `📊 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          images.length / batchSize
        )}`
      );

      try {
        const response = await ocrAxios.post(
          `${ocrServiceUrl}/api/ocr/batch-extract`,
          {
            images: batch,
          }
        );

        if (response.data.success) {
          results.push(
            ...response.data.data.map((result) => ({
              extractedText: result.text,
              confidence: result.confidence,
              words: result.words,
              boundingBoxes: result.bounding_boxes,
            }))
          );
        } else {
          // Add error results for failed batch
          batch.forEach(() => {
            results.push({
              extractedText: "",
              confidence: 0,
              words: [],
              boundingBoxes: [],
              error: response.data.error,
            });
          });
        }
      } catch (batchError) {
        console.error(
          `❌ Batch ${Math.floor(i / batchSize) + 1} failed:`,
          batchError.message
        );
        // Add error results for failed batch
        batch.forEach(() => {
          results.push({
            extractedText: "",
            confidence: 0,
            words: [],
            boundingBoxes: [],
            error: batchError.message,
          });
        });
      }

      // Small delay between batches to prevent overwhelming the service
      if (i + batchSize < images.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️  Batch processing completed in ${processingTime}s`);

    return res.json({
      success: true,
      data: results,
      processingTime: processingTime,
      totalImages: images.length,
    });
  } catch (error) {
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(
      `❌ Batch OCR Error after ${processingTime}s:`,
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to process images",
      error: error.message,
      processingTime: processingTime,
    });
  }
};

// Check OCR service health with enhanced diagnostics
const checkOCRServiceHealth = async (req, res) => {
  try {
    console.log("🏥 Checking OCR service health...");

    const response = await axios.get(`${ocrServiceUrl}/health`, {
      timeout: 10000, // 10 second timeout for health check
    });

    console.log("✅ OCR service health check passed");

    return res.json({
      success: true,
      serviceStatus: response.data,
      timestamp: new Date().toISOString(),
      serviceUrl: ocrServiceUrl,
    });
  } catch (error) {
    console.error("❌ OCR service health check failed:", error.message);

    let healthStatus = {
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
      serviceUrl: ocrServiceUrl,
    };

    // Provide more specific error information
    if (error.code === "ECONNREFUSED") {
      healthStatus.diagnosis = "Service is not running or not accessible";
      healthStatus.suggestion =
        "Start the Python OCR service with: python ocr_service_qwen.py";
    } else if (error.code === "ENOTFOUND") {
      healthStatus.diagnosis = "Service URL is not reachable";
      healthStatus.suggestion = "Check if the service URL is correct";
    } else if (error.code === "TIMEOUT") {
      healthStatus.diagnosis = "Service is not responding";
      healthStatus.suggestion = "Service may be overloaded or stuck";
    }

    return res.status(503).json({
      success: false,
      message: "OCR service is unavailable",
      healthStatus: healthStatus,
    });
  }
};

// Save OCR result to database (optional implementation)
const saveOCRResult = async (userId, ocrData) => {
  try {
    // Implement database saving logic here if needed
    console.log(
      `💾 Saving OCR result for user ${userId} (${ocrData.text.length} characters)`
    );

    // Example implementation:
    // const ocrResult = new OCRResult({
    //   userId: userId,
    //   extractedText: ocrData.text,
    //   confidence: ocrData.confidence,
    //   timestamp: new Date(),
    //   wordCount: ocrData.words ? ocrData.words.length : 0
    // });
    // await ocrResult.save();
  } catch (error) {
    console.error("❌ Error saving OCR result:", error);
  }
};

module.exports = {
  extractTextFromImage,
  extractTextFromFile,
  batchExtractText,
  checkOCRServiceHealth,
  upload,
  saveOCRResult, 
};
