const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
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

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Import routes
const authRoutes = require("./route/auth");
const openAiRoutes = require("./route/openAiRoutes");
const assessmentRoutes = require("./route/assessment");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/gpt",openAiRoutes);
app.use("/api/assessment", assessmentRoutes);
















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
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});
