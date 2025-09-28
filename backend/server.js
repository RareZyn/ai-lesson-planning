const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Check if MONGO_URI is loaded
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI environment variable is not defined");
  console.log("Available environment variables:");
  console.log(Object.keys(process.env).filter((key) => key.includes("MONGO")));
  process.exit(1);
}

// CORS configuration
const corsOptions = {
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Increase payload limits for OCR
app.use(
  express.json({
    limit: "100mb",
    extended: true,
    parameterLimit: 50000,
  })
);

app.use(
  express.urlencoded({
    limit: "100mb",
    extended: true,
    parameterLimit: 50000,
  })
);

// middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(morgan("dev"));

// Set request timeout - INCREASED FOR OCR PROCESSING
app.use((req, res, next) => {
  // Set longer timeout for OCR routes
  if (req.url.includes("/api/ocr")) {
    req.setTimeout(600000); // 10 minutes for OCR requests
    res.setTimeout(600000); // 10 minutes for OCR responses
  } else {
    req.setTimeout(300000); // 5 minutes for other requests
  }
  next();
});

// Import routes
const authRoutes = require("./route/auth");
const openAiRoutes = require("./route/openAiRoutes");
const assessmentRoutes = require("./route/assessment");
const dskpRoutes = require("./route/dskp");
const textbookRoutes = require("./route/textbook");
const classRoutes = require("./route/classRoutes");
const sowRoutes = require("./route/sowRoutes");
const lessonRoutes = require("./route/lessonRoutes");
const communityRoutes = require("./route/communityRoute");
const ocrRoutes = require("./route/ocrRoutes");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/gpt", openAiRoutes);
app.use("/api/assessment", assessmentRoutes);
app.use("/api/dskp", dskpRoutes);
app.use("/api/textbook", textbookRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/sow", sowRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/ocr", ocrRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running successfully",
    timestamp: new Date().toISOString(),
  });
});

// OCR service health check route
app.get("/api/ocr-health", async (req, res) => {
  try {
    const axios = require("axios");
    const ocrServiceUrl =
      process.env.OCR_SERVICE_URL || "http://localhost:5001";

    const response = await axios.get(`${ocrServiceUrl}/health`, {
      timeout: 10000, // 10 second timeout for health check
    });

    res.status(200).json({
      success: true,
      message: "OCR service is healthy",
      serviceInfo: response.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "OCR service is unavailable",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  // Handle timeout errors
  if (err.code === "TIMEOUT" || err.message.includes("timeout")) {
    return res.status(408).json({
      success: false,
      message: "Request timeout - processing took too long",
      suggestion: "Try with a smaller image or enable preprocessing",
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return res.status(400).json({
      success: false,
      message: `${
        field ? field.charAt(0).toUpperCase() + field.slice(1) : "Field"
      } already exists`,
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors,
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Server Error",
  });
});

// Connect to MongoDB
console.log("🔄 Connecting to MongoDB...");
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    console.log(`📁 Database: ${mongoose.connection.db.databaseName}`);
  })
  .catch((err) => {
    console.log("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/`);
  console.log(`🤖 OCR endpoints: http://localhost:${PORT}/api/ocr/`);
  console.log(`📊 Body parser limit: 100MB for OCR uploads`);
  console.log(`⏱️  OCR timeout: 10 minutes`);
});

// Set server timeout for long-running OCR requests
server.timeout = 600000; // 10 minutes
server.keepAliveTimeout = 610000; // 10 minutes + 10 seconds
server.headersTimeout = 620000; // 10 minutes + 20 seconds

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});
