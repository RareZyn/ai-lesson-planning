const { generateSmartSuggestions } = require("../services/aiSuggestionService");
const LessonPlan = require("../model/Lesson");
const Class = require("../model/Class");
const fs = require('fs');
const path = require('path');

const logDebug = (msg) => {
    try {
        fs.appendFileSync(path.join(__dirname, '../backend-debug.log'), new Date().toISOString() + ': ' + msg + '\n');
    } catch (e) { }
};

/**
 * Suggestions Controller
 * Handles AI smart suggestion endpoints
 */

/**
 * @desc    Generate smart suggestions for lesson planning
 * @route   POST /api/suggestions/smart
 * @access  Private
 */
const getSmartSuggestions = async (req, res) => {


    try {
        const userId = req.user.id;
        const { classId, currentStep } = req.body;
        logDebug(`[Backend Controller] Request received - User: ${userId}, Class: ${classId}`);

        // Validate required fields
        if (!classId) {
            return res.status(400).json({
                success: false,
                message: "classId is required",
            });
        }

        // Verify class exists and belongs to user
        const classData = await Class.findOne({
            _id: classId,
            createdBy: userId,
        });

        if (!classData) {
            return res.status(404).json({
                success: false,
                message: "Class not found or you don't have access to it",
            });
        }

        // Generate suggestions
        const result = await generateSmartSuggestions(userId, classId, {
            subject: classData.subject,
            grade: classData.grade,
            year: classData.year,
        });

        if (!result.success) {
            return res.status(200).json({
                success: false,
                message: result.message,
                suggestions: null,
                patterns: null,
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                suggestions: result.suggestions,
                patterns: result.patterns,
            },
        });
    } catch (error) {
        console.error("Error in getSmartSuggestions:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate suggestions",
            error: error.message,
        });
    }
};

/**
 * @desc    Record feedback when user accepts/rejects a suggestion
 * @route   POST /api/suggestions/feedback
 * @access  Private
 */
const recordSuggestionFeedback = async (req, res) => {
    try {
        const userId = req.user.id;
        const { lessonId, suggestionType, accepted, accurate } = req.body;

        // Validate required fields
        if (!lessonId || !suggestionType || accepted === undefined) {
            return res.status(400).json({
                success: false,
                message: "lessonId, suggestionType, and accepted are required",
            });
        }

        // Validate suggestion type
        const validTypes = ["sowTopic", "date", "activityType", "resource"];
        if (!validTypes.includes(suggestionType)) {
            return res.status(400).json({
                success: false,
                message: `suggestionType must be one of: ${validTypes.join(", ")}`,
            });
        }

        // Find the lesson and verify ownership
        const lesson = await LessonPlan.findOne({
            _id: lessonId,
            createdBy: userId,
        });

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found or you don't have access to it",
            });
        }

        // Record the feedback
        if (!lesson.aiSuggestions) {
            lesson.aiSuggestions = {
                usagePatterns: {
                    lastAnalyzed: null,
                    patterns: {},
                },
                acceptedSuggestions: [],
            };
        }

        // Only record if suggestion was accepted
        if (accepted) {
            lesson.aiSuggestions.acceptedSuggestions.push({
                suggestionType,
                acceptedAt: new Date(),
                wasAccurate: accurate !== undefined ? accurate : true,
            });

            await lesson.save();
        }

        return res.status(200).json({
            success: true,
            message: "Feedback recorded successfully",
        });
    } catch (error) {
        console.error("Error in recordSuggestionFeedback:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to record feedback",
            error: error.message,
        });
    }
};

/**
 * @desc    Get teacher's suggestion usage statistics
 * @route   GET /api/suggestions/stats
 * @access  Private
 */
const getSuggestionStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get all lessons with accepted suggestions
        const lessonsWithSuggestions = await LessonPlan.find({
            createdBy: userId,
            "aiSuggestions.acceptedSuggestions": { $exists: true, $ne: [] },
        }).select("aiSuggestions");

        // Calculate statistics
        const stats = {
            totalSuggestionsAccepted: 0,
            byType: {
                sowTopic: 0,
                date: 0,
                activityType: 0,
                resource: 0,
            },
            accuracyRate: 0,
        };

        let totalAccurate = 0;

        lessonsWithSuggestions.forEach((lesson) => {
            if (lesson.aiSuggestions?.acceptedSuggestions) {
                lesson.aiSuggestions.acceptedSuggestions.forEach((suggestion) => {
                    stats.totalSuggestionsAccepted++;
                    if (stats.byType[suggestion.suggestionType] !== undefined) {
                        stats.byType[suggestion.suggestionType]++;
                    }
                    if (suggestion.wasAccurate) {
                        totalAccurate++;
                    }
                });
            }
        });

        if (stats.totalSuggestionsAccepted > 0) {
            stats.accuracyRate = (
                (totalAccurate / stats.totalSuggestionsAccepted) *
                100
            ).toFixed(1);
        }

        return res.status(200).json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error("Error in getSuggestionStats:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get suggestion stats",
            error: error.message,
        });
    }
};

module.exports = {
    getSmartSuggestions,
    recordSuggestionFeedback,
    getSuggestionStats,
};
