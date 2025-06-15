// src/services/assessmentService.js - Updated for lesson-based assessment integration
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

// Create axios instance with interceptors
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
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
  (response) => response,
  (error) => {
    console.error("Assessment API Error:", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

/**
 * Assessment API Service for lesson plan-based assessments
 */
export const assessmentAPI = {
  // Generate full lesson planner (lesson info + activities)
  generateFullLessonPlanner: async (lessonData) => {
    try {
      const response = await apiClient.post(
        "/assessment/fullLessonPlanner",
        lessonData
      );
      return response.data;
    } catch (error) {
      console.error("Error generating full lesson planner:", error);
      throw error;
    }
  },

  // Generate activity and rubric based on lesson plan
  generateActivityAndRubric: async (assessmentData) => {
    try {
      const response = await apiClient.post(
        "/assessment/generateActivityAndRubric",
        assessmentData
      );
      return response.data;
    } catch (error) {
      console.error("Error generating activity and rubric:", error);
      throw error;
    }
  },

  // Generate essay assessment
  generateEssayAssessment: async (essayData) => {
    try {
      const response = await apiClient.post(
        "/assessment/generateEssayAssessment",
        essayData
      );
      return response.data;
    } catch (error) {
      console.error("Error generating essay assessment:", error);
      throw error;
    }
  },

  // Generate textbook activity
  generateTextbookActivity: async (textbookData) => {
    try {
      const response = await apiClient.post(
        "/assessment/generateTextbookActivity",
        textbookData
      );
      return response.data;
    } catch (error) {
      console.error("Error generating textbook activity:", error);
      throw error;
    }
  },

  // Save generated assessment to database
  saveAssessment: async (assessmentData) => {
    try {
      const response = await apiClient.post("/assessment/save", assessmentData);
      return response.data;
    } catch (error) {
      console.error("Error saving assessment:", error);
      throw error;
    }
  },

  // Get user's assessments with filtering and pagination
  getUserAssessments: async (params = {}) => {
    try {
      const response = await apiClient.get("/assessment/my-assessments", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching user assessments:", error);
      throw error;
    }
  },

  // Get assessment by ID
  getAssessmentById: async (assessmentId) => {
    try {
      const response = await apiClient.get(`/assessment/${assessmentId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching assessment:", error);
      throw error;
    }
  },

  // Update assessment
  updateAssessment: async (assessmentId, updateData) => {
    try {
      const response = await apiClient.put(
        `/assessment/${assessmentId}`,
        updateData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating assessment:", error);
      throw error;
    }
  },

  // Delete assessment
  deleteAssessment: async (assessmentId) => {
    try {
      const response = await apiClient.delete(`/assessment/${assessmentId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting assessment:", error);
      throw error;
    }
  },

  // Main integration function: Generate assessment from lesson plan
  generateFromLessonPlan: async (lessonPlanData, activityFormData) => {
    try {
      console.log("Starting assessment generation with data:", {
        lessonPlanData,
        activityFormData,
      });

      // Prepare the request data based on the backend controller structure
      const requestData = {
        // Lesson plan information
        lesson: lessonPlanData.lesson || lessonPlanData.title,
        subject: lessonPlanData.subject,
        theme: lessonPlanData.theme,
        topic: lessonPlanData.topic,
        grade: lessonPlanData.grade,

        // Standards
        contentStandard: {
          main: lessonPlanData.contentStandard?.main || "",
          component: lessonPlanData.contentStandard?.component || "",
        },
        learningStandard: {
          main: lessonPlanData.learningStandard?.main || "",
          component: lessonPlanData.learningStandard?.component || "",
        },

        // Learning outline from lesson plan
        learningOutline: {
          pre: lessonPlanData.learningOutline?.pre || "",
          during: lessonPlanData.learningOutline?.during || "",
          post: lessonPlanData.learningOutline?.post || "",
        },

        // Activity type determines which endpoint to call
        activityType: activityFormData.activityType || "activityInClass",

        // Additional form data from user input
        ...activityFormData,
      };

      console.log("Prepared request data:", requestData);

      // Call the appropriate generation endpoint based on activity type
      let generationResponse;
      switch (requestData.activityType) {
        case "essay":
          generationResponse = await assessmentAPI.generateEssayAssessment(
            requestData
          );
          break;
        case "textbook":
          generationResponse = await assessmentAPI.generateTextbookActivity(
            requestData
          );
          break;
        case "activityInClass":
        case "assessment":
        default:
          generationResponse = await assessmentAPI.generateActivityAndRubric(
            requestData
          );
          break;
      }

      console.log("Generation response:", generationResponse);

      // If generation successful, save the assessment
      if (generationResponse.success) {
        const saveData = {
          title:
            lessonPlanData.assessmentTitle ||
            `Assessment - ${lessonPlanData.lesson}`,
          description:
            lessonPlanData.assessmentDescription ||
            "Generated from lesson plan",
          lessonPlanId: lessonPlanData.lessonPlanId,
          classId: lessonPlanData.classId,
          activityType: requestData.activityType,
          assessmentType: "Generated Assessment",
          questionCount: 20, // Default or from form data
          duration: "60 minutes", // Default or from form data
          difficulty: "Intermediate", // Default or from form data
          skills: [], // From form data if available
          generatedContent: {
            activityHTML: generationResponse.activityHTML,
            rubricHTML: generationResponse.rubricHTML,
            aiResponse: generationResponse,
          },
          lessonPlanSnapshot: {
            title: lessonPlanData.lesson,
            subject: lessonPlanData.subject,
            grade: lessonPlanData.grade,
            contentStandard: lessonPlanData.contentStandard,
            learningStandard: lessonPlanData.learningStandard,
            learningOutline: lessonPlanData.learningOutline,
          },
          hasActivity: !!generationResponse.activityHTML,
          hasRubric: !!generationResponse.rubricHTML,
          status: "Generated",
        };

        console.log("Saving assessment data:", saveData);
        const saveResponse = await assessmentAPI.saveAssessment(saveData);

        return {
          success: true,
          generation: generationResponse,
          saved: saveResponse,
          data: saveResponse.data,
        };
      }

      return generationResponse;
    } catch (error) {
      console.error("Error in generateFromLessonPlan:", error);
      throw error;
    }
  },
};

export default assessmentAPI;
