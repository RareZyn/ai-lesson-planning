import axios from 'axios';

const getAuthConfig = () => ({
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
});

/**
 * Generates a new lesson plan based on the user's input. This function posts the given form data to the server
 * and returns the newly generated lesson plan object.
 * @param {object} formData - The user's input data from the lesson generation form.
 * @returns {Promise<object>} The newly generated lesson plan object.
 */
export const generateLesson = async (formData) => {
    try {
        const response = await axios.post('/api/lessons', formData, getAuthConfig());
        return response.data.data;
    } catch (error) {
        console.error('Error generating lesson plan:', error.response?.data?.message || error.message);
        // Re-throw a more user-friendly error
        throw new Error(error.response?.data?.message || "Failed to communicate with the server.");
    }
};

/**
 * Saves the final lesson plan to the database.
 * @param {object} finalPlanData - The complete object with parameters and plan.
 * @returns {Promise<object>} The saved lesson plan document from the backend.
 */
export const saveLessonPlan = async (finalPlanData) => {
    try {
        // This calls POST /api/lessons
        const response = await axios.post('/api/lessons/save', finalPlanData, getAuthConfig());
        return response.data; // The backend returns { success: true, data: newLessonPlan }
    } catch (error) {
        console.error("Error saving lesson plan:", error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to save the lesson plan.');
    }
};

/**
 * Fetches a single lesson plan by its unique ID.
 * @param {string} id - The _id of the lesson plan.
 * @returns {Promise<object>} The detailed lesson plan object.
 */
export const getLessonPlanById = async (id) => {
    try {
        // This calls GET /api/lessons/:id
        const response = await axios.get(`/api/lessons/${id}`, getAuthConfig());
        return response.data.data; // The plan is nested in the 'data' property
    } catch (error) {
        console.error("Error fetching lesson plan:", error.response?.data);
        throw new Error(error.response?.data?.message || 'Could not fetch the lesson plan.');
    }
};

/**
 * Fetches all lesson plans for the currently logged-in user.
 * @returns {Promise<Array>} A promise that resolves to an array of lesson plans.
 */
export const getAllLessonPlans = async () => {
     try {
        // This calls GET /api/lessons/:id
        const response = await axios.get(`/api/lessons`, getAuthConfig());
        return response.data.data; // The plan is nested in the 'data' property
    } catch (error) {
        console.error("Error fetching lesson plan:", error.response?.data);
        throw new Error(error.response?.data?.message || 'Could not fetch the lesson plan.');
    }
};

/**
 * Fetches the 5 most recently updated lesson plans for the user.
 * @returns {Promise<Array>} A promise that resolves to an array of up to 5 lesson plans.
 */
export const getRecentLessonPlans = async () => {
    try {
        // This calls GET /api/lessons/recent
        const response = await axios.get('/api/lessons/recent', getAuthConfig());
        return response.data.data; // The plan is nested in the 'data' property
    } catch (error) {
        console.error("Error fetching recent lesson plans:", error.response?.data);
        throw new Error(error.response?.data?.message || 'Could not fetch recent lessons.');
    }
};
