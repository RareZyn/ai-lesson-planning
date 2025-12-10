import axios from "axios";
import { isOnline } from "./networkStatus";
import lessonOfflineService from "./offline/lessonOfflineService";

const getAuthConfig = () => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
  },
});

/**
 * Generates a new lesson plan based on the user's input. This function posts the given form data to the server
 * and returns the newly generated lesson plan object.
 * @param {object} formData - The user's input data from the lesson generation form.
 * @returns {Promise<object>} The newly generated lesson plan object.
 */
export const generateLesson = async (formData) => {
  try {
    const response = await axios.post(
      "/api/lessons",
      {
        ...formData,
        activityType: formData.activityType,
        activityConfiguration: formData.activityConfiguration,
      },
      getAuthConfig()
    );
    return response.data.data;
  } catch (error) {
    console.error(
      "Error generating lesson plan:",
      error.response?.data?.message || error.message
    );
    // Re-throw a more user-friendly error
    throw new Error(
      error.response?.data?.message || "Failed to communicate with the server."
    );
  }
};

/**
 * Saves the final lesson plan to the database with activity configuration.
 * @param {object} finalPlanData - The complete object with parameters, plan, and activity configuration.
 * @returns {Promise<object>} The saved lesson plan document from the backend.
 */
export const saveLessonPlan = async (finalPlanData) => {
  try {
    // Ensure we include the activity configuration in the saved data
    const response = await axios.post(
      "/api/lessons/save",
      {
        ...finalPlanData,
        // Ensure activity configuration is included at both levels
        parameters: {
          ...finalPlanData.parameters,
          activityType: finalPlanData.activityType,
          activityConfiguration: finalPlanData.activityConfiguration,
        },
        activityType: finalPlanData.activityType,
        activityConfiguration: finalPlanData.activityConfiguration,
      },
      getAuthConfig()
    );
    return response.data; // The backend returns { success: true, data: newLessonPlan }
  } catch (error) {
    console.error("Error saving lesson plan:", error.response?.data);
    throw new Error(
      error.response?.data?.message || "Failed to save the lesson plan."
    );
  }
};

/**
 * Fetches a single lesson plan by its unique ID.
 * @param {string} id - The _id of the lesson plan.
 * @returns {Promise<object>} The detailed lesson plan object.
 */
export const getLessonPlanById = async (id) => {
  try {
    // Check if online
    if (isOnline()) {
      // Try to fetch from API
      const response = await axios.get(`/api/lessons/${id}`, getAuthConfig());
      const lessonData = response.data.data;

      // Save to offline cache for future offline access
      try {
        await lessonOfflineService.saveLessonOffline(lessonData);
      } catch (cacheErr) {
        console.warn("Failed to cache lesson:", cacheErr);
      }

      return lessonData;
    } else {
      // Offline - fetch from IndexedDB
      console.log("[LessonService] Offline mode - fetching from cache");
      const cachedLesson = await lessonOfflineService.getLessonOffline(id);

      if (!cachedLesson) {
        throw new Error("This lesson plan is not available offline. Please connect to the internet to view it.");
      }

      return cachedLesson;
    }
  } catch (error) {
    // If online but network failed, try offline cache as fallback
    if (isOnline() && error.code === 'ERR_NETWORK') {
      console.log("[LessonService] Network error - trying offline cache");
      try {
        const cachedLesson = await lessonOfflineService.getLessonOffline(id);
        if (cachedLesson) {
          return cachedLesson;
        }
      } catch (offlineErr) {
        console.error("Offline cache also failed:", offlineErr);
      }
    }

    console.error("Error fetching lesson plan:", error.response?.data || error.message);
    throw new Error(
      error.message || error.response?.data?.message || "Could not fetch the lesson plan."
    );
  }
};

/**
 * Fetches all lesson plans for the currently logged-in user.
 * @returns {Promise<Array>} A promise that resolves to an array of lesson plans.
 */
export const getAllLessonPlans = async () => {
  try {
    // Check if online
    if (isOnline()) {
      // Try to fetch from API
      const response = await axios.get(`/api/lessons`, getAuthConfig());
      const lessonsData = response.data.data;

      // Save all lessons to offline cache
      try {
        await lessonOfflineService.saveLessonsBatch(lessonsData);
      } catch (cacheErr) {
        console.warn("Failed to cache lessons:", cacheErr);
      }

      return lessonsData;
    } else {
      // Offline - fetch from IndexedDB
      console.log("[LessonService] Offline mode - fetching all lessons from cache");
      const cachedLessons = await lessonOfflineService.getAllLessonsOffline();

      if (!cachedLessons || cachedLessons.length === 0) {
        console.warn("No lessons available offline");
        return [];
      }

      return cachedLessons;
    }
  } catch (error) {
    // If online but network failed, try offline cache as fallback
    if (isOnline() && (error.code === 'ERR_NETWORK' || error.code === 'ERR_INTERNET_DISCONNECTED')) {
      console.log("[LessonService] Network error - trying offline cache");
      try {
        const cachedLessons = await lessonOfflineService.getAllLessonsOffline();
        if (cachedLessons) {
          return cachedLessons;
        }
      } catch (offlineErr) {
        console.error("Offline cache also failed:", offlineErr);
      }
    }

    console.error("Error fetching lesson plans:", error.response?.data || error.message);
    throw new Error(
      error.message || error.response?.data?.message || "Could not fetch the lesson plans."
    );
  }
};


/**
 * Fetches the 5 most recently updated lesson plans for the currently logged-in user.
 * This function uses a cache buster to prevent unnecessary re-fetching of data.
 * The cache buster is a query parameter that is updated every time the function is called.
 * If the data has not been modified since the last call, a 304 response is sent.
 * @returns {Promise<Array>} A promise that resolves to an array of the 5 most recently updated lesson plans.
 */
export const getRecentLessonPlans = async () => {
  try {
    // --- IMPLEMENTING CACHE BUSTER ---
    const cacheBuster = Date.now();
    const url = `/api/lessons/recent?v=${cacheBuster}`;
    // This calls GET /api/lessons/recent?v=<timestamp>
    const response = await axios.get(url, getAuthConfig());
    // --- END CACHE BUSTER ---

    return response.data.data; // The plans are nested in the 'data' property
  } catch (error) {
    console.error("Error fetching recent lesson plans:", error.response?.data);
    throw new Error(
      error.response?.data?.message || "Could not fetch recent lessons."
    );
  }
};

/**
 * Deletes a lesson plan by its unique ID.
 * @param {string} id - The _id of the lesson plan to delete.
 * @returns {Promise<object>}
 */
export const deleteLessonPlan = async (id) => {
  try {
    // For DELETE requests, the config is also the second argument
    const response = await axios.delete(`/api/lessons/${id}`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error("Error deleting lesson plan:", error.response?.data);
    throw new Error(
      error.response?.data?.message || "Could not delete the lesson plan."
    );
  }
};

/**
 * Fetches all lesson plans for a specific class ID.
 * @param {string} classId - The ID of the class.
 * @returns {Promise<Array>}
 */
export const getLessonPlansByClass = async (classId) => {
  try {
    const response = await axios.get(
      `/api/lessons/by-class/${classId}`,
      getAuthConfig()
    );
    return response.data.data;
  } catch (error) {
    console.error(
      "Error fetching lesson plans by class:",
      error.response?.data
    );
    throw new Error(
      error.response?.data?.message || "Could not fetch lesson plans."
    );
  }
};

/**
 * Updates the 'plan' part of a lesson plan document.
 * @param {string} id - The ID of the lesson plan to update.
 * @param {object} updatedPlan - The new 'plan' object.
 * @returns {Promise<object>} The full, updated lesson plan document.
 */
export const updateLessonPlan = async (id, updatedPlan) => {
  try {
    // The data sent is an object with a 'plan' key, e.g., { plan: updatedPlan }
    const response = await axios.put(
      `/api/lessons/${id}`,
      { plan: updatedPlan },
      getAuthConfig()
    );
    return response.data.data;
  } catch (error) {
    console.error("Error updating lesson plan:", error.response?.data);
    throw new Error(
      error.response?.data?.message || "Could not update the lesson plan."
    );
  }
};

/**
 * Updates the activity configuration of a lesson plan.
 * @param {string} id - The ID of the lesson plan to update.
 * @param {object} activityConfiguration - The new activity configuration object.
 * @returns {Promise<object>} The full, updated lesson plan document.
 */
export const updateLessonPlanActivityConfig = async (
  id,
  activityConfiguration
) => {
  try {
    const response = await axios.put(
      `/api/lessons/${id}/activity-config`,
      {
        activityConfiguration,
      },
      getAuthConfig()
    );
    return response.data.data;
  } catch (error) {
    console.error(
      "Error updating lesson plan activity configuration:",
      error.response?.data
    );
    throw new Error(
      error.response?.data?.message ||
      "Could not update the activity configuration."
    );
  }
};

/**
 * Get lesson plans that have activity configurations for assessment creation
 * @returns {Promise<Array>} A promise that resolves to an array of lesson plans with activity configurations.
 */
export const getLessonPlansWithActivityConfig = async () => {
  try {
    const response = await axios.get(
      "/api/lessons/with-activity-config",
      getAuthConfig()
    );
    return response.data.data;
  } catch (error) {
    console.error(
      "Error fetching lesson plans with activity config:",
      error.response?.data
    );
    throw new Error(
      error.response?.data?.message ||
      "Could not fetch lesson plans with activity configurations."
    );
  }
};

/**
 * Get lesson plans without assessments (for assessment creation)
 * @returns {Promise<Array>} A promise that resolves to an array of lesson plans without assessments.
 */
export const getLessonPlansWithoutAssessments = async () => {
  try {
    const response = await axios.get(
      "/api/lessons/without-assessments",
      getAuthConfig()
    );
    return response.data.data;
  } catch (error) {
    console.error(
      "Error fetching lesson plans without assessments:",
      error.response?.data
    );
    throw new Error(
      error.response?.data?.message ||
      "Could not fetch lesson plans without assessments."
    );
  }
};

/**
 * Sends a section of the lesson plan to the backend for AI enhancement.
 * @param {object} payload - The data needed for enhancement.
 * @param {string} payload.sectionKey - The key of the section to enhance (e.g., 'learningObjective', 'activities.preLesson').
 * @param {string|string[]} payload.currentContent - The existing content of that section.
 * @param {string} payload.userPrompt - The user's instruction for enhancement.
 * @param {object} payload.context - Additional context for the AI (grade, subject, topic, etc.).
 * @returns {Promise<string|string[]>} - The enhanced content from the AI.
 */
export const enhanceLessonSection = async (payload) => {
  try {
    const response = await axios.post(
      "/api/lessons/enhance", // Your new backend endpoint
      payload,
      getAuthConfig()
    );
    // Assuming the backend returns an object like { success: true, enhancedContent: "..." }
    return response.data.enhancedContent;
  } catch (error) {
    console.error(
      "Error enhancing lesson section:",
      error.response?.data?.message || error.message
    );
    throw new Error(
      error.response?.data?.message || "Failed to enhance the section."
    );
  }
};

/**
 * Sends a lesson plan for approval.
 * @param {string} id - The ID of the lesson plan to send for approval.
 * @returns {Promise<object>} - The response from the server.
 */
export const sendForApproval = async (id) => {
  try {
    const response = await axios.post(
      `/api/lessons/${id}/send-approval`,
      {},
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error sending lesson for approval:",
      error.response?.data?.message || error.message
    );
    throw new Error(
      error.response?.data?.message || "Failed to send lesson for approval."
    );
  }
};
