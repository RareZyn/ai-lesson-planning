const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Check if MONGO_URI is loaded (skip in serverless build phase)
if (!process.env.MONGO_URI && process.env.NODE_ENV !== 'build') {
  console.error("❌ MONGO_URI environment variable is not defined");
  console.log("Available environment variables:");
  console.log(Object.keys(process.env).filter((key) => key.includes("MONGO")));
  // Don't exit in serverless environment, just warn
  if (process.env.VERCEL !== '1') {
    process.exit(1);
  }
}

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL, /\.vercel\.app$/]
    : ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  optionsSuccessStatus: 200,
};


// middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Increased limit for image uploads
app.use(cookieParser());
app.use(morgan("dev"));

// Database connection middleware
app.use(require('./middleware/dbConnect'));

// Import routes
const authRoutes = require("./route/auth");
const assessmentRoutes = require("./route/assessment");
const dskpRoutes = require("./route/dskp");
const textbookRoutes = require("./route/textbook");
const classRoutes = require("./route/classRoutes");
const sowRoutes = require("./route/sowRoutes");
const lessonRoutes = require("./route/lessonRoutes");
const communityRoutes = require("./route/communityRoute");
const ocrRoutes = require("./route/ocrRoutes");
const studentRoutes = require("./route/studentRoutes");
const answerRoutes = require("./route/answerRoutes");
const gradingRoutes = require("./route/gradingRoutes");
const manualEditRoutes = require("./route/manualEditRoutes");
const reviewRoutes = require("./route/reviewRoutes");
const analyticsRoutes = require("./route/analyticsRoutes");
const adminRoutes = require("./route/adminRoutes");
const syncRoutes = require("./route/syncRoutes");
const notificationRoutes = require("./route/notificationRoutes");
const searchRoutes = require("./route/searchRoutes");
const suggestionsRoutes = require("./route/suggestionsRoutes");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/assessment", assessmentRoutes);
app.use("/api/dskp", dskpRoutes);
app.use("/api/textbook", textbookRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/sow", sowRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/answers", answerRoutes);
app.use("/api/grading", gradingRoutes);
app.use("/api/manual-edit", manualEditRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/materials", require("./route/materialRoutes"));
app.use("/api/search", searchRoutes);
app.use("/api/suggestions", suggestionsRoutes);


// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running successfully",
    timestamp: new Date().toISOString(),
  });
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
      message: `${field ? field.charAt(0).toUpperCase() + field.slice(1) : "Field"
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
if (process.env.MONGO_URI) {
  console.log("🔄 Connecting to MongoDB...");
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("✅ MongoDB connected successfully");
      console.log(`📁 Database: ${mongoose.connection.db.databaseName}`);
    })
    .catch((err) => {
      console.log("❌ MongoDB connection error:", err);
    });
}

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions
});

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Join a personal room based on userId (sent from client)
  socket.on("join", (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} joined room user_${userId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Store io instance in app to use in controllers
app.set("io", io);

// Only start server if not in serverless environment
if (process.env.VERCEL !== '1' && require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/`);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    server.close(() => {
      mongoose.connection.close();
      process.exit(0);
    });
  });
}

// Export for Vercel serverless
module.exports = app;
// Trigger restart for AI suggestions routes
