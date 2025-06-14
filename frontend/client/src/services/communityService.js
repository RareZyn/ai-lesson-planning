// src/services/communityService.js - Updated with bookmark functionality
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

// Create axios instance with interceptors
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API Error:", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("authToken");
    }
    return Promise.reject(error);
  }
);

/**
 * Community API Service
 */
export const communityAPI = {
  // Get all lesson plans in the database (admin only)
  getAllLessonPlans: async (params = {}) => {
    try {
      const response = await apiClient.get("/community/all-lessons", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching all lesson plans:", error);
      throw error;
    }
  },

  // Get user's lesson plans (requires userId as query param)
  getUserLessonPlans: async (userId, params = {}) => {
    try {
      if (!userId) {
        throw new Error("userId is required for getUserLessonPlans");
      }

      const response = await apiClient.get("/community/my-lessons", {
        params: { userId, ...params },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching user lesson plans:", error);
      throw error;
    }
  },

  // NEW: Get user's bookmarked lesson plans
  getUserBookmarks: async (userId, params = {}) => {
    try {
      if (!userId) {
        throw new Error("userId is required for getUserBookmarks");
      }

      const response = await apiClient.get("/community/bookmarks", {
        params: { userId, ...params },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching user bookmarks:", error);
      throw error;
    }
  },

  // NEW: Toggle bookmark status for a lesson plan
  toggleBookmark: async (lessonPlanId, userId) => {
    try {
      if (!lessonPlanId) {
        throw new Error("lessonPlanId is required for toggleBookmark");
      }

      if (!userId) {
        throw new Error("userId is required for toggleBookmark");
      }

      const response = await apiClient.put(
        `/community/bookmark/${lessonPlanId}`,
        { userId }
      );
      return response.data;
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      throw error;
    }
  },

  // Get community shared lessons - Updated to include bookmark status
  getCommunityLessons: async (params = {}) => {
    try {
      const response = await apiClient.get("/community/shared-lessons", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching community lessons:", error);
      throw error;
    }
  },

  // Share a lesson plan to community
  shareLessonPlan: async (lessonPlanId, shareData) => {
    try {
      if (!lessonPlanId) {
        throw new Error("lessonPlanId is required for shareLessonPlan");
      }

      if (!shareData.userId) {
        throw new Error("userId is required in shareData for shareLessonPlan");
      }

      const response = await apiClient.put(
        `/community/share/${lessonPlanId}`,
        shareData // This should contain { userId, title, description, tags }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Unshare a lesson plan from community
  unshareLessonPlan: async (lessonPlanId, userId) => {
    try {
      const response = await apiClient.put(
        `/community/unshare/${lessonPlanId}`,
        { userId }
      );
      return response.data;
    } catch (error) {
      console.error("Error unsharing lesson plan:", error);
      throw error;
    }
  },

  // Like/Unlike a lesson plan
  toggleLike: async (lessonPlanId, userId) => {
    try {
      const response = await apiClient.put(`/community/like/${lessonPlanId}`, {
        userId,
      });
      return response.data;
    } catch (error) {
      console.error("Error toggling like:", error);
      throw error;
    }
  },

  // Download a lesson plan
  downloadLessonPlan: async (lessonPlanId, userId) => {
    try {
      const response = await apiClient.post(
        `/community/download/${lessonPlanId}`,
        { userId }
      );
      return response.data;
    } catch (error) {
      console.error("Error downloading lesson plan:", error);
      throw error;
    }
  },

  // Get community statistics
  getCommunityStats: async () => {
    try {
      const response = await apiClient.get("/community/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching community stats:", error);
      throw error;
    }
  },
};

export default communityAPI;
