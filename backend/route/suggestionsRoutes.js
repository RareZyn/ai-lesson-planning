const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
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
router.post("/smart", getSmartSuggestions);

// @route   POST /api/suggestions/feedback
// @desc    Record feedback when user accepts/rejects a suggestion
// @access  Private
router.post("/feedback", recordSuggestionFeedback);

// @route   GET /api/suggestions/stats
// @desc    Get teacher's suggestion usage statistics
// @access  Private
router.get("/stats", getSuggestionStats);

module.exports = router;
