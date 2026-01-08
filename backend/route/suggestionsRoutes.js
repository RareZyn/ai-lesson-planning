const express = require("express");
const router = express.Router();
const { protect, checkPermission } = require("../middleware/auth");
const { PERMISSIONS } = require("../config/permissions");
const {
    getSmartSuggestions,
    recordSuggestionFeedback,
    getSuggestionStats,
} = require("../controller/suggestionsController");

// All routes require authentication
router.use(protect);

// @route   POST /api/suggestions/smart
// @desc    Get smart AI suggestions for lesson planning
// @access  Private
// Allowing any user who can update lessons to get suggestions
router.post("/smart", checkPermission(PERMISSIONS.LESSON_UPDATE), getSmartSuggestions);

// @route   POST /api/suggestions/feedback
// @desc    Record feedback when user accepts/rejects a suggestion
// @access  Private
router.post("/feedback", checkPermission(PERMISSIONS.LESSON_UPDATE), recordSuggestionFeedback);

// @route   GET /api/suggestions/stats
// @desc    Get teacher's suggestion usage statistics
// @access  Private
router.get("/stats", checkPermission(PERMISSIONS.USER_READ), getSuggestionStats);

module.exports = router;
