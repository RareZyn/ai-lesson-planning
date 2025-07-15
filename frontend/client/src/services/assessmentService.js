// src/services/assessmentService.js - Updated with getLessonPlansWithoutAssessments
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


export const assessmentAPI = {

  generateFromLessonPlan: async (lessonPlanData, activityFormData) => {
    try {
      console.log("Starting assessment generation with data:", {
        lessonPlanData,
        activityFormData,
      });

      // Prepare the request data to match backend controller expectations
      const requestData = {
        // Required fields for backend validation
        lessonPlanId: lessonPlanData.lessonPlanId || lessonPlanData._id,
        classId: lessonPlanData.classId || activityFormData.classId,
        lesson: lessonPlanData.lesson || lessonPlanData.title,
        activityType: activityFormData.activityType || "activityInClass",

        // Lesson plan core information
        subject: lessonPlanData.subject,
        theme: lessonPlanData.theme,
        topic: lessonPlanData.topic,
        grade: lessonPlanData.grade,

        // Standards from lesson plan
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

        // Assessment metadata
        assessmentTitle:
          activityFormData.assessmentTitle ||
          `${lessonPlanData.lesson || "Assessment"} - ${
            activityFormData.activityType
          }`,
        assessmentDescription:
          activityFormData.assessmentDescription ||
          `Generated ${activityFormData.activityType} assessment`,

        // Activity-specific data from form
        ...activityFormData,
      };

      console.log("Prepared request data:", requestData);

      // Call the unified backend endpoint
      const response = await apiClient.post(
        "/assessment/generateFromLessonPlan",
        requestData
      );

      console.log("Backend response:", response.data);

      return {
        success: true,
        data: response.data.data, // The saved assessment
        generatedContent: response.data.generatedContent,
        message: response.data.message,
      };
    } catch (error) {
      console.error("Error in generateFromLessonPlan:", error);
      throw error;
    }
  },

  /**
   * NEW: Get lesson plans without assessments
   * This is used by the LessonSelectionModal to show only lesson plans
   * that don't have assessments yet
   */
  getLessonPlansWithoutAssessments: async () => {
    try {
      const response = await apiClient.get("/assessment/available-lessons");
      return response.data;
    } catch (error) {
      console.error("Error fetching lesson plans without assessments:", error);
      throw error;
    }
  },

  /**
   * Save assessment manually (if needed for standalone assessments)
   */
  saveAssessment: async (assessmentData) => {
    try {
      const response = await apiClient.post("/assessment/save", assessmentData);
      return response.data;
    } catch (error) {
      console.error("Error saving assessment:", error);
      throw error;
    }
  },

  /**
   * Get user's assessments with filtering and pagination
   */
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

  /**
   * Get assessment by ID
   */
  getAssessmentById: async (assessmentId) => {
    try {
      const response = await apiClient.get(`/assessment/${assessmentId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching assessment:", error);
      throw error;
    }
  },

  /**
   * Update assessment
   */
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

  /**
   * Delete assessment
   */
  deleteAssessment: async (assessmentId) => {
    try {
      const response = await apiClient.delete(`/assessment/${assessmentId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting assessment:", error);
      throw error;
    }
  },

  /**
   * Get assessments for a specific lesson plan
   */
  getAssessmentsByLessonPlan: async (lessonPlanId) => {
    try {
      const response = await apiClient.get("/assessment/my-assessments", {
        params: { lessonPlanId },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching assessments for lesson plan:", error);
      throw error;
    }
  },

  /**
   * Get assessments for a specific class
   */
  getAssessmentsByClass: async (classId) => {
    try {
      const response = await apiClient.get("/assessment/my-assessments", {
        params: { classId },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching assessments for class:", error);
      throw error;
    }
  },

  /**
   * Export assessment content as PDF or DOCX
   */
  exportAssessment: async (assessmentId, format = "pdf") => {
    try {
      const response = await apiClient.get(
        `/assessment/${assessmentId}/export`,
        {
          params: { format },
          responseType: "blob",
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `assessment.${format}`);
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
};

// Utility functions for assessment data preparation
export const assessmentUtils = {
  /**
   * Prepare lesson plan data for assessment generation
   */
  prepareLessonPlanData: (lessonPlan, classInfo) => {
    return {
      lessonPlanId: lessonPlan._id,
      classId: classInfo?._id || lessonPlan.classId,
      lesson: lessonPlan.parameters?.specificTopic || lessonPlan.title,
      subject: lessonPlan.parameters?.subject || classInfo?.subject,
      theme: lessonPlan.parameters?.theme,
      topic: lessonPlan.parameters?.topic,
      grade: lessonPlan.parameters?.formLevel || classInfo?.grade,
      contentStandard: lessonPlan.parameters?.contentStandard,
      learningStandard: lessonPlan.parameters?.learningStandard,
      learningOutline: lessonPlan.plan
        ? {
            pre: Array.isArray(lessonPlan.plan.activities?.preLesson)
              ? lessonPlan.plan.activities.preLesson.join("; ")
              : lessonPlan.plan.activities?.preLesson || "",
            during: Array.isArray(lessonPlan.plan.activities?.duringLesson)
              ? lessonPlan.plan.activities.duringLesson.join("; ")
              : lessonPlan.plan.activities?.duringLesson || "",
            post: Array.isArray(lessonPlan.plan.activities?.postLesson)
              ? lessonPlan.plan.activities.postLesson.join("; ")
              : lessonPlan.plan.activities?.postLesson || "",
          }
        : {},
    };
  },

  /**
   * Validate assessment form data
   */
  validateAssessmentForm: (formData) => {
    const errors = [];

    if (!formData.activityType) {
      errors.push("Activity type is required");
    }

    if (formData.activityType === "essay" && !formData.essayType) {
      errors.push("Essay type is required for essay assessments");
    }

    if (formData.activityType === "assessment" && !formData.questionTypes) {
      errors.push("Question types are required for assessments");
    }

    if (
      formData.numberOfQuestions &&
      (formData.numberOfQuestions < 1 || formData.numberOfQuestions > 100)
    ) {
      errors.push("Number of questions must be between 1 and 100");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Get default assessment settings based on activity type
   */
  getDefaultSettings: (activityType) => {
    const defaults = {
      activityInClass: {
        duration: "30-45 minutes",
        numberOfQuestions: 10,
        studentArrangement: "small_group",
        resourceUsage: "classroom_only",
      },
      essay: {
        duration: "60 minutes",
        wordCount: "200-300 words",
        essayType: "descriptive",
      },
      textbook: {
        duration: "45 minutes",
        resourceUsage: "textbook_required",
      },
      assessment: {
        duration: "60 minutes",
        numberOfQuestions: 20,
        questionTypes: ["multiple_choice", "short_answer"],
        assessmentType: "Unit Test",
      },
    };

    return defaults[activityType] || defaults.activityInClass;
  },
};

export default assessmentAPI;
