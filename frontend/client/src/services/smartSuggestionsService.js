import axios from "axios";

const getAuthConfig = () => ({
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
    },
});

/**
 * AI Smart Suggestions Service
 * Handles API calls for fetching suggestions and recording feedback
 */

/**
 * Fetch smart suggestions for a specific class and lesson step
 * @param {string} classId - The ID of the class
 * @param {number} currentStep - Current step in the planner (should be 2)
 * @returns {Promise<Object>} Suggestions data and patterns
 */
export const getSmartSuggestions = async (classId, currentStep = 2) => {
    console.log(`[Frontend] Fetching suggestions for Class ID: ${classId}`);
    try {
        const response = await axios.post(
            "/api/suggestions/smart",
            { classId, currentStep },
            getAuthConfig()
        );
        console.log("[Frontend] Raw API Response:", response.data);

        if (response.data.success) {
            return response.data.data;
        }
        return null;
    } catch (error) {
        console.error("Error fetching smart suggestions:", error);
        throw error;
    }
};

/**
 * Record user feedback when a suggestion is applied/rejected
 * @param {string} lessonId - The ID of the lesson being created/edited
 * @param {string} suggestionType - Type of suggestion (sowTopic, date, activityType, resource)
 * @param {boolean} accepted - Whether the suggestion was accepted
 * @param {boolean} accurate - Whether the suggestion was accurate (optional)
 * @returns {Promise<Object>} Response data
 */
export const recordFeedback = async (
    lessonId,
    suggestionType,
    accepted,
    accurate = true
) => {
    try {
        const response = await axios.post(
            "/api/suggestions/feedback",
            {
                lessonId,
                suggestionType,
                accepted,
                accurate,
            },
            getAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error("Error recording feedback:", error);
        // Don't throw for feedback - it's a background task
        return null;
    }
};

/**
 * Get teacher's suggestion usage statistics
 * @returns {Promise<Object>} Statistics data
 */
export const getSuggestionStats = async () => {
    try {
        const response = await axios.get(
            "/api/suggestions/stats",
            getAuthConfig()
        );
        return response.data.data;
    } catch (error) {
        console.error("Error fetching suggestion stats:", error);
        throw error;
    }
};
