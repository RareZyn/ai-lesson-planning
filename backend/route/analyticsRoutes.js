// backend/route/analyticsRoutes.js
const express = require("express");
const router = express.Router();
const {
  getClassAnalytics,
  getClassAnalyticsCombined,
  getStudentProgress,
  getFrequentlyMissedQuestions,
  getClassStudentsList,
  getAvailableTopics,
  generateReport,
} = require("../controller/analyticsController");
const { protect } = require("../middleware/auth");

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/analytics/class/:classId
 * @desc    Get class performance analytics
 * @query   startDate, endDate, topic, assessmentType
 * @access  Private
 */
router.get("/class/:classId", getClassAnalytics);

/**
 * @route   GET /api/analytics/class/:classId/combined
 * @desc    Get all class analytics data in a single request (optimized)
 * @query   startDate, endDate, topic, assessmentType
 * @access  Private
 */
router.get("/class/:classId/combined", getClassAnalyticsCombined);

/**
 * @route   GET /api/analytics/student/:studentId
 * @desc    Get individual student progress analytics
 * @query   startDate, endDate, assessmentType
 * @access  Private
 */
router.get("/student/:studentId", getStudentProgress);

/**
 * @route   GET /api/analytics/missed-questions/:classId
 * @desc    Get frequently missed questions for a class
 * @access  Private
 */
router.get("/missed-questions/:classId", getFrequentlyMissedQuestions);

/**
 * @route   GET /api/analytics/missed-questions/assessment/:assessmentId
 * @desc    Get frequently missed questions for a specific assessment
 * @access  Private
 */
router.get(
  "/missed-questions/assessment/:assessmentId",
  getFrequentlyMissedQuestions
);

/**
 * @route   GET /api/analytics/students/:classId
 * @desc    Get all students in a class with performance stats
 * @access  Private
 */
router.get("/students/:classId", getClassStudentsList);

/**
 * @route   GET /api/analytics/topics/:classId
 * @desc    Get available topics for filtering
 * @access  Private
 */
router.get("/topics/:classId", getAvailableTopics);

/**
 * @route   POST /api/analytics/report
 * @desc    Generate performance report (class or student)
 * @body    { type: 'class' | 'student', classId?, studentId?, filters }
 * @access  Private
 */
router.post("/report", generateReport);

module.exports = router;
