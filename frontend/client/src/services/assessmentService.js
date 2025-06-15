// src/services/assessmentService.js - Updated and enhanced
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

  // Update assessment (if needed in the future)
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

  // Regenerate assessment content
  regenerateAssessment: async (assessmentId, regenerationType = "both") => {
    try {
      // First get the assessment data
      const assessmentResponse = await apiClient.get(
        `/assessment/${assessmentId}`
      );
      const assessment = assessmentResponse.data.data;

      if (!assessment) {
        throw new Error("Assessment not found");
      }

      // Use the stored original data to regenerate
      const originalData = {
        contentStandard: assessment.lessonPlanSnapshot?.contentStandard,
        learningStandard: assessment.lessonPlanSnapshot?.learningStandard,
        learningOutline: assessment.lessonPlanSnapshot?.learningOutline,
        lesson: assessment.lessonPlanSnapshot?.title,
        subject: assessment.lessonPlanSnapshot?.subject,
        theme: assessment.lessonPlanSnapshot?.theme,
        topic: assessment.lessonPlanSnapshot?.topic,
        activityType: assessment.activityType,
        lessonPlanId: assessment.lessonPlanId,
        classId: assessment.classId,
        assessmentTitle: assessment.title,
        assessmentType: assessment.assessmentType,
        questionCount: assessment.questionCount,
        duration: assessment.duration,
        difficulty: assessment.difficulty,
        skills: assessment.skills,
      };

      // Call the appropriate generation endpoint
      let response;
      switch (assessment.activityType) {
        case "essay":
          response = await apiClient.post(
            "/assessment/generateEssayAssessment",
            originalData
          );
          break;
        case "textbook":
          response = await apiClient.post(
            "/assessment/generateTextbookActivity",
            originalData
          );
          break;
        case "activity":
        case "assessment":
        default:
          response = await apiClient.post(
            "/assessment/generateActivityAndRubric",
            originalData
          );
          break;
      }

      return response.data;
    } catch (error) {
      console.error("Error regenerating assessment:", error);
      throw error;
    }
  },

  // Get assessment statistics (for dashboard)
  getAssessmentStats: async () => {
    try {
      const response = await apiClient.get("/assessment/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching assessment stats:", error);
      throw error;
    }
  },

  // Search assessments
  searchAssessments: async (searchTerm, filters = {}) => {
    try {
      const params = {
        search: searchTerm,
        ...filters,
      };
      const response = await apiClient.get("/assessment/my-assessments", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error searching assessments:", error);
      throw error;
    }
  },

  // Export assessment to different formats
  exportAssessment: async (assessmentId, format = "pdf") => {
    try {
      const response = await apiClient.get(
        `/assessment/${assessmentId}/export`,
        {
          params: { format },
          responseType: "blob", // Important for file downloads
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `assessment_${assessmentId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true, message: "Assessment exported successfully" };
    } catch (error) {
      console.error("Error exporting assessment:", error);
      throw error;
    }
  },

  // Duplicate assessment
  duplicateAssessment: async (assessmentId, newTitle) => {
    try {
      const response = await apiClient.post(
        `/assessment/${assessmentId}/duplicate`,
        {
          title: newTitle,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error duplicating assessment:", error);
      throw error;
    }
  },

  // Share assessment (if community feature is needed)
  shareAssessment: async (assessmentId, shareData) => {
    try {
      const response = await apiClient.post(
        `/assessment/${assessmentId}/share`,
        shareData
      );
      return response.data;
    } catch (error) {
      console.error("Error sharing assessment:", error);
      throw error;
    }
  },

  // Get assessment templates (for quick creation)
  getAssessmentTemplates: async () => {
    try {
      const response = await apiClient.get("/assessment/templates");
      return response.data;
    } catch (error) {
      console.error("Error fetching assessment templates:", error);
      throw error;
    }
  },

  // Create assessment from template
  createFromTemplate: async (templateId, customData) => {
    try {
      const response = await apiClient.post(
        `/assessment/templates/${templateId}/create`,
        customData
      );
      return response.data;
    } catch (error) {
      console.error("Error creating assessment from template:", error);
      throw error;
    }
  },
};

export default assessmentAPI;
