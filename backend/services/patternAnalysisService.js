const LessonPlan = require("../model/Lesson");
const fs = require('fs');
const path = require('path');

const logDebug = (msg) => {
    try {
        fs.appendFileSync(path.join(__dirname, '../../backend-debug.log'), new Date().toISOString() + ': ' + msg + '\n');
    } catch (e) { }
};

/**
 * Pattern Analysis Service
 * Analyzes teacher's lesson history to detect patterns for AI suggestions
 */

/**
 * Analyze a teacher's lesson patterns for a specific class
 * @param {string} userId - The teacher's user ID
 * @param {string} classId - The class ID
 * @param {number} limit - Number of recent lessons to analyze (default: 30)
 * @returns {Object} Pattern analysis results
 */
async function analyzeTeacherPatterns(userId, classId, limit = 30) {
    try {
        // Fetch recent lessons for this teacher and class
        // Fetch recent lessons for this teacher and class
        console.log(`DEBUG: Analyzing patterns for User: ${userId}, Class: ${classId}`);
        const lessons = await LessonPlan.find({
            createdBy: userId,
            classId: classId,
        })
            .sort({ lessonDate: -1, createdAt: -1 })
            .limit(limit)
            .select("lessonDate createdAt parameters.activityType parameters.sow")
            .lean(); // Use lean for performance

        console.log(`DEBUG: Found ${lessons.length} lessons for pattern analysis.`);

        // Post-process to ensure lessonDate exists (fallback to createdAt)
        lessons.forEach(lesson => {
            if (!lesson.lessonDate && lesson.createdAt) {
                lesson.lessonDate = lesson.createdAt;
            }
        });

        if (lessons.length === 0) {
            return {
                hasData: false,
                confidence: "low",
                message: "Not enough lesson history to analyze patterns",
            };
        }

        // Pattern 1: Day of Week Preference
        const dayOfWeekPattern = analyzeDayOfWeekPreference(lessons);

        // Pattern 2: Activity Type by Day
        const activityByDayPattern = analyzeActivityByDay(lessons);

        // Pattern 3: Average Gap Between Lessons
        const lessonGapPattern = calculateAverageLessonGap(lessons);

        // Pattern 4: SOW Progression
        const sowProgressionPattern = analyzeSOWProgression(lessons);

        // Calculate confidence score
        const confidence = calculateConfidence(lessons.length);

        return {
            hasData: true,
            confidence,
            lessonCount: lessons.length,
            patterns: {
                preferredDays: dayOfWeekPattern,
                activityByDay: activityByDayPattern,
                averageGapDays: lessonGapPattern,
                sowProgression: sowProgressionPattern,
            },
            lastAnalyzed: new Date(),
        };
    } catch (error) {
        console.error("Error analyzing teacher patterns:", error);
        throw error;
    }
}

/**
 * Analyze which days of the week the teacher prefers to schedule lessons
 * @param {Array} lessons - Array of lesson documents
 * @returns {Object} Day preference counts
 */
function analyzeDayOfWeekPreference(lessons) {
    const dayCount = {
        Monday: 0,
        Tuesday: 0,
        Wednesday: 0,
        Thursday: 0,
        Friday: 0,
        Saturday: 0,
        Sunday: 0,
    };

    lessons.forEach((lesson) => {
        if (lesson.lessonDate) {
            const dayName = new Date(lesson.lessonDate).toLocaleDateString("en-US", {
                weekday: "long",
            });
            if (dayCount[dayName] !== undefined) {
                dayCount[dayName]++;
            }
        }
    });

    // Find the most preferred day
    const sortedDays = Object.entries(dayCount)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]);

    return {
        counts: dayCount,
        mostPreferred: sortedDays.length > 0 ? sortedDays[0][0] : null,
        mostPreferredCount: sortedDays.length > 0 ? sortedDays[0][1] : 0,
    };
}

/**
 * Analyze which activity types the teacher uses on which days
 * @param {Array} lessons - Array of lesson documents
 * @returns {Object} Activity type patterns by day
 */
function analyzeActivityByDay(lessons) {
    const activityByDay = {};

    lessons.forEach((lesson) => {
        if (lesson.lessonDate && lesson.parameters?.activityType) {
            const dayName = new Date(lesson.lessonDate).toLocaleDateString("en-US", {
                weekday: "long",
            });
            const activityType = lesson.parameters.activityType;

            const key = `${dayName}_${activityType}`;
            activityByDay[key] = (activityByDay[key] || 0) + 1;
        }
    });

    // Convert to more readable format
    const patterns = {};
    Object.entries(activityByDay).forEach(([key, count]) => {
        const [day, activity] = key.split("_");
        if (!patterns[day]) {
            patterns[day] = {};
        }
        patterns[day][activity] = count;
    });

    return patterns;
}

/**
 * Calculate average gap between consecutive lessons
 * @param {Array} lessons - Array of lesson documents
 * @returns {number} Average gap in days
 */
function calculateAverageLessonGap(lessons) {
    if (lessons.length < 2) {
        return null;
    }

    // Sort lessons by date (newest first)
    const sortedLessons = [...lessons].sort(
        (a, b) => new Date(b.lessonDate) - new Date(a.lessonDate)
    );

    const gaps = [];
    for (let i = 0; i < sortedLessons.length - 1; i++) {
        const currentDate = new Date(sortedLessons[i].lessonDate);
        const nextDate = new Date(sortedLessons[i + 1].lessonDate);
        const gapInDays = Math.abs(
            (currentDate - nextDate) / (1000 * 60 * 60 * 24)
        );
        gaps.push(gapInDays);
    }

    const averageGap =
        gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;

    return Math.round(averageGap);
}

/**
 * Analyze SOW progression to determine which topics have been covered
 * @param {Array} lessons - Array of lesson documents
 * @returns {Object} SOW progression information
 */
function analyzeSOWProgression(lessons) {
    const coveredTopics = new Set();
    const sowTopicSequence = [];

    lessons.forEach((lesson) => {
        if (lesson.parameters?.sow) {
            const sowData = lesson.parameters.sow;
            const topicId = sowData.id || sowData._id;
            const topicTitle = sowData.topic || sowData.title || sowData.specificTopic;

            if (topicId) {
                coveredTopics.add(topicId.toString());
                if (topicTitle) {
                    sowTopicSequence.push({
                        id: topicId.toString(),
                        title: topicTitle,
                    });
                }
            }
        }
    });

    return {
        coveredTopicsCount: coveredTopics.size,
        coveredTopicIds: Array.from(coveredTopics),
        recentTopics: sowTopicSequence.slice(0, 5), // Last 5 topics covered
    };
}

/**
 * Calculate confidence score based on available data
 * @param {number} lessonCount - Number of lessons analyzed
 * @returns {string} Confidence level: "high", "medium", or "low"
 */
function calculateConfidence(lessonCount) {
    if (lessonCount >= 10) {
        return "high";
    } else if (lessonCount >= 5) {
        return "medium";
    } else {
        return "low";
    }
}

/**
 * Predict the next optimal lesson date based on patterns
 * @param {Object} patterns - Pattern analysis results
 * @returns {Date} Suggested next lesson date
 */
function predictNextLessonDate(patterns) {
    const { preferredDays, averageGapDays } = patterns;

    // Start with tomorrow
    let suggestedDate = new Date();
    suggestedDate.setDate(suggestedDate.getDate() + 1);

    // If we have an average gap, use it
    if (averageGapDays && averageGapDays > 0) {
        suggestedDate.setDate(suggestedDate.getDate() + averageGapDays - 1);
    }

    // If we have a preferred day, find the next occurrence of that day
    if (preferredDays.mostPreferred) {
        const preferredDayIndex = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ].indexOf(preferredDays.mostPreferred);

        let daysUntilPreferred =
            (preferredDayIndex - suggestedDate.getDay() + 7) % 7;
        if (daysUntilPreferred === 0) daysUntilPreferred = 7; // Next week if today

        suggestedDate.setDate(suggestedDate.getDate() + daysUntilPreferred);
    }

    return suggestedDate;
}

module.exports = {
    analyzeTeacherPatterns,
    predictNextLessonDate,
};
