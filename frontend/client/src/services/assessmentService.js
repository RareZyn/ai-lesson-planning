// src/services/assessmentService.js - Fixed version without syntax errors
import axios from "axios";
import { isOnline } from "./networkStatus";
import assessmentOfflineService from "./offline/assessmentOfflineService";

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
  /**
   * Generate assessment directly from lesson plan (streamlined version)
   * This bypasses the modal selection since activity type is already configured
   */
  generateFromLessonPlan: async (lessonPlanData, activityFormData) => {
    try {

      // Prepare the request data to match backend controller expectations
      const requestData = {
        // Core required fields
        lessonPlanId: lessonPlanData.lessonPlanId,
        classId: lessonPlanData.classId,

        // Activity type from lesson plan configuration
        activityType: activityFormData.activityType || "activity",

        // Lesson plan information
        lesson: lessonPlanData.lesson,
        subject: lessonPlanData.subject,
        theme: lessonPlanData.theme,
        topic: lessonPlanData.topic,
        grade: lessonPlanData.grade,

        // Standards from lesson plan
        contentStandard: lessonPlanData.contentStandard || {},
        learningStandard: lessonPlanData.learningStandard || {},
        learningOutline: lessonPlanData.learningOutline || {},

        // Assessment metadata
        assessmentTitle: lessonPlanData.assessmentTitle,
        assessmentDescription: lessonPlanData.assessmentDescription,

        // Activity-specific configuration from lesson plan
        activityConfiguration: {
          type: activityFormData.activityType,
          parameters: activityFormData,
          configuredAt: new Date().toISOString(),
          configuredFor:
            activityFormData.configuredFor || activityFormData.activityType,
        },

        // Pass through any additional form data
        ...activityFormData,
      };

      // Call the backend endpoint for direct generation
      const response = await apiClient.post(
        "/assessment/generateFromLessonPlan",
        requestData
      );

      return {
        success: true,
        data: response.data.data, // The saved assessment
        generatedContent: response.data.generatedContent,
        message: response.data.message || "Assessment generated successfully",
      };
    } catch (error) {
      console.error("Error in generateFromLessonPlan:", error);

      // Enhanced error handling
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to generate assessment";

      return {
        success: false,
        message: errorMessage,
        error: error.response?.data || error,
      };
    }
  },

  /**
   * Generate assessment with pre-configured activity settings
   * This is used when the lesson plan already has activity configuration
   */
  generateAssessmentFromConfiguredLesson: async (lessonPlan) => {
    try {
      // Extract activity configuration from lesson plan
      const activityConfig = lessonPlan.parameters?.activityConfiguration;

      if (!activityConfig) {
        throw new Error("Lesson plan does not have activity configuration");
      }

      // Prepare lesson plan data
      const lessonPlanData = {
        lessonPlanId: lessonPlan._id,
        classId: lessonPlan.classId?._id || lessonPlan.classId,
        lesson: lessonPlan.parameters?.specificTopic || "Assessment",
        subject: lessonPlan.classId?.subject || lessonPlan.parameters?.subject,
        theme: lessonPlan.parameters?.sow?.theme,
        topic: lessonPlan.parameters?.specificTopic,
        grade: lessonPlan.parameters?.grade,
        contentStandard: {
          main: lessonPlan.parameters?.sow?.contentStandard?.main || "",
          component: lessonPlan.parameters?.sow?.contentStandard?.comp || "",
        },
        learningStandard: {
          main: lessonPlan.parameters?.sow?.learningStandard?.main || "",
          component: lessonPlan.parameters?.sow?.learningStandard?.comp || "",
        },
        learningOutline: {
          pre: lessonPlan.parameters?.sow?.learningOutline?.pre || "",
          during: lessonPlan.parameters?.sow?.learningOutline?.during || "",
          post: lessonPlan.parameters?.sow?.learningOutline?.post || "",
        },
        assessmentTitle: `${
          lessonPlan.parameters?.specificTopic || "Assessment"
        } - ${activityConfig.type}`,
        assessmentDescription: lessonPlan.plan?.learningObjective || "",
      };

      // Use the configured activity data
      const activityFormData = {
        activityType: activityConfig.type,
        ...activityConfig.parameters,
        configuredFor: activityConfig.configuredFor,
      };

      // Call the standard generation method
      return await this.generateFromLessonPlan(
        lessonPlanData,
        activityFormData
      );
    } catch (error) {
      console.error(
        "Error generating assessment from configured lesson:",
        error
      );
      throw error;
    }
  },

  /**
   * Check if a lesson plan can generate an assessment
   * Returns validation information about the lesson plan
   */
  validateLessonPlanForAssessment: async (lessonPlanId) => {
    try {
      const response = await apiClient.get(
        `/assessment/validate-lesson/${lessonPlanId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error validating lesson plan:", error);
      return {
        success: false,
        canGenerate: false,
        message: error.response?.data?.message || "Validation failed",
        issues: error.response?.data?.issues || [],
      };
    }
  },

  /**
   * Get lesson plans that are ready for assessment generation
   * Only returns lesson plans with activity configurations
   */
  getLessonPlansReadyForAssessment: async () => {
    try {
      const response = await apiClient.get("/assessment/ready-lessons");
      return response.data;
    } catch (error) {
      console.error("Error fetching ready lesson plans:", error);
      throw error;
    }
  },

  /**
   * Get lesson plans without assessments (for assessment creation)
   * This endpoint shows lesson plans that don't have assessments yet
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
   * Create standalone assessment (without lesson plan)
   */
  createStandaloneAssessment: async (assessmentData) => {
    try {
      // Prepare the request data for standalone assessment
      const requestData = {
        // Core required fields
        activityType: assessmentData.activityType,
        grade: assessmentData.grade,
        subject: assessmentData.subject,

        // Optional class information
        classId: assessmentData.classId || null,
        className: assessmentData.className || null,

        // Assessment metadata
        assessmentTitle:
          assessmentData.assessmentTitle ||
          `${assessmentData.subject} ${assessmentData.activityType} - ${assessmentData.grade}`,
        assessmentDescription:
          assessmentData.assessmentDescription ||
          `Standalone ${assessmentData.activityType} assessment`,

        // Mark as standalone
        isStandalone: true,
        hasLessonPlan: false,

        // Activity-specific configuration
        activityConfiguration: {
          type: assessmentData.activityType,
          parameters: assessmentData,
          configuredAt: new Date().toISOString(),
          configuredFor: assessmentData.activityType,
        },

        // Pass through all form data
        ...assessmentData,
      };
      // Call the backend endpoint for standalone assessment creation
      const response = await apiClient.post(
        "/assessment/standalone",
        requestData
      );
      return {
        success: true,
        data: response.data.data, // The saved assessment
        generatedContent: response.data.generatedContent,
        message:
          response.data.message || "Standalone assessment created successfully",
      };
    } catch (error) {
      console.error("Error creating standalone assessment:", error);

      // Enhanced error handling
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create standalone assessment";

      return {
        success: false,
        message: errorMessage,
        error: error.response?.data || error,
      };
    }
  },

  /**
   * Get user's standalone assessments (assessments without lesson plans)
   */
  getStandaloneAssessments: async (params = {}) => {
    try {
      const response = await apiClient.get("/assessment/standalone", {
        params: {
          ...params,
          hasLessonPlan: "false", // Ensure we only get standalone assessments
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching standalone assessments:", error);
      throw error;
    }
  },

  /**
   * Update standalone assessment
   */
  updateStandaloneAssessment: async (assessmentId, updateData) => {
    try {
      const response = await apiClient.put(
        `/assessment/standalone/${assessmentId}`,
        updateData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating standalone assessment:", error);
      throw error;
    }
  },

  /**
   * Clone standalone assessment
   */
  cloneStandaloneAssessment: async (assessmentId, newTitle = null) => {
    try {
      const response = await apiClient.post(
        `/assessment/standalone/${assessmentId}/clone`,
        {
          newTitle,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error cloning standalone assessment:", error);
      throw error;
    }
  },

  /**
   * Generate preview for standalone assessment before creating
   */
  previewStandaloneAssessment: async (assessmentData) => {
    try {
      const response = await apiClient.post(
        "/assessment/standalone/preview",
        assessmentData
      );
      return response.data;
    } catch (error) {
      console.error("Error generating standalone assessment preview:", error);
      throw error;
    }
  },

  /**
   * Get standalone assessment templates by activity type
   */
  getStandaloneTemplates: async (
    activityType,
    grade = null,
    subject = null
  ) => {
    try {
      const response = await apiClient.get("/assessment/standalone/templates", {
        params: {
          activityType,
          grade,
          subject,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching standalone templates:", error);
      throw error;
    }
  },

  /**
   * Save standalone assessment as template
   */
  saveStandaloneAsTemplate: async (assessmentId, templateData) => {
    try {
      const response = await apiClient.post(
        `/assessment/standalone/${assessmentId}/template`,
        templateData
      );
      return response.data;
    } catch (error) {
      console.error("Error saving standalone assessment as template:", error);
      throw error;
    }
  },

  /**
   * Bulk create standalone assessments
   */
  bulkCreateStandaloneAssessments: async (assessmentDataList) => {
    try {
      const response = await apiClient.post("/assessment/standalone/bulk", {
        assessments: assessmentDataList,
      });
      return response.data;
    } catch (error) {
      console.error("Error bulk creating standalone assessments:", error);
      throw error;
    }
  },

  /**
   * Get standalone assessment statistics
   */
  getStandaloneAssessmentStats: async (filters = {}) => {
    try {
      const response = await apiClient.get("/assessment/standalone/stats", {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching standalone assessment stats:", error);
      throw error;
    }
  },

  /**
   * Get user's assessments with filtering and pagination (offline-aware)
   */
  getUserAssessments: async (params = {}) => {
    try {
      // Check if online
      if (isOnline()) {
        // Try to fetch from API
        const response = await apiClient.get("/assessment/my-assessments", {
          params,
        });
        const assessmentsData = response.data;

        // Save all assessments to offline cache
        if (assessmentsData.data && Array.isArray(assessmentsData.data)) {
          try {
            await assessmentOfflineService.saveAssessmentsBatch(assessmentsData.data);
          } catch (cacheErr) {
            console.warn("Failed to cache assessments:", cacheErr);
          }
        }

        return assessmentsData;
      } else {
        // Offline - fetch from IndexedDB
        console.log("[AssessmentService] Offline mode - fetching assessments from cache");
        const cachedAssessments = await assessmentOfflineService.getAllAssessmentsOffline();

        // Apply client-side filtering for offline mode
        let filteredAssessments = cachedAssessments || [];

        if (params.hasLessonPlan) {
          filteredAssessments = filteredAssessments.filter(a => {
            const hasLesson = !!a.lessonPlanId;
            return params.hasLessonPlan === "true" ? hasLesson : !hasLesson;
          });
        }

        if (params.classId) {
          filteredAssessments = filteredAssessments.filter(a =>
            a.classId === params.classId || a.classId?._id === params.classId
          );
        }

        if (params.activityType) {
          filteredAssessments = filteredAssessments.filter(a =>
            a.activityType === params.activityType
          );
        }

        return { success: true, data: filteredAssessments };
      }
    } catch (error) {
      // If online but network failed, try offline cache as fallback
      if (isOnline() && (error.code === 'ERR_NETWORK' || error.code === 'ERR_INTERNET_DISCONNECTED')) {
        console.log("[AssessmentService] Network error - trying offline cache");
        try {
          const cachedAssessments = await assessmentOfflineService.getAllAssessmentsOffline();
          return { success: true, data: cachedAssessments || [] };
        } catch (offlineErr) {
          console.error("Offline cache also failed:", offlineErr);
        }
      }

      console.error("Error fetching user assessments:", error);
      throw error;
    }
  },

  /**
   * Get assessment by ID (offline-aware)
   */
  getAssessmentById: async (assessmentId) => {
    try {
      // Check if online
      if (isOnline()) {
        // Try to fetch from API
        const response = await apiClient.get(`/assessment/${assessmentId}`);
        const assessmentData = response.data;

        // Save to offline cache for future offline access
        try {
          await assessmentOfflineService.saveAssessmentOffline(assessmentData.data || assessmentData);
        } catch (cacheErr) {
          console.warn("Failed to cache assessment:", cacheErr);
        }

        return assessmentData;
      } else {
        // Offline - fetch from IndexedDB
        console.log("[AssessmentService] Offline mode - fetching from cache");
        const cachedAssessment = await assessmentOfflineService.getAssessmentOffline(assessmentId);

        if (!cachedAssessment) {
          throw new Error("This assessment is not available offline. Please connect to the internet to view it.");
        }

        return { success: true, data: cachedAssessment };
      }
    } catch (error) {
      // If online but network failed, try offline cache as fallback
      if (isOnline() && (error.code === 'ERR_NETWORK' || error.code === 'ERR_INTERNET_DISCONNECTED')) {
        console.log("[AssessmentService] Network error - trying offline cache");
        try {
          const cachedAssessment = await assessmentOfflineService.getAssessmentOffline(assessmentId);
          if (cachedAssessment) {
            return { success: true, data: cachedAssessment };
          }
        } catch (offlineErr) {
          console.error("Offline cache also failed:", offlineErr);
        }
      }

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

  /**
   * Regenerate assessment content for existing assessment
   */
  regenerateAssessment: async (assessmentId, regenerationData) => {
    try {
      const response = await apiClient.put(
        `/assessment/${assessmentId}/regenerate`,
        regenerationData
      );
      return {
        success: true,
        data: response.data.data, // The updated assessment
        generatedContent: response.data.generatedContent,
        message: response.data.message || "Assessment regenerated successfully",
      };
    } catch (error) {
      console.error("Error regenerating assessment:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to regenerate assessment";

      return {
        success: false,
        message: errorMessage,
        error: error.response?.data || error,
      };
    }
  },

  /**
   * Get assessment generation history for a lesson plan
   */
  getAssessmentHistory: async (lessonPlanId) => {
    try {
      const response = await apiClient.get(
        `/assessment/history/${lessonPlanId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching assessment history:", error);
      throw error;
    }
  },

  /**
   * Bulk generate assessments for multiple lesson plans
   */
  bulkGenerateAssessments: async (lessonPlanIds) => {
    try {
      const response = await apiClient.post("/assessment/bulk-generate", {
        lessonPlanIds,
      });
      return response.data;
    } catch (error) {
      console.error("Error bulk generating assessments:", error);
      throw error;
    }
  },

  /**
   * Get assessment statistics for dashboard
   */
  getAssessmentStats: async (filters = {}) => {
    try {
      const response = await apiClient.get("/assessment/stats", {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching assessment stats:", error);
      throw error;
    }
  },

  /**
   * Clone/duplicate an existing assessment
   */
  cloneAssessment: async (assessmentId, newTitle = null) => {
    try {
      const response = await apiClient.post(
        `/assessment/${assessmentId}/clone`,
        {
          newTitle,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error cloning assessment:", error);
      throw error;
    }
  },

  /**
   * Get assessment templates
   */
  getAssessmentTemplates: async (activityType = null) => {
    try {
      const response = await apiClient.get("/assessment/templates", {
        params: activityType ? { activityType } : {},
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching assessment templates:", error);
      throw error;
    }
  },

  /**
   * Save assessment as template
   */
  saveAsTemplate: async (assessmentId, templateName, description = "") => {
    try {
      const response = await apiClient.post(
        `/assessment/${assessmentId}/template`,
        {
          templateName,
          description,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error saving assessment as template:", error);
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
      theme: lessonPlan.parameters?.sow?.theme,
      topic: lessonPlan.parameters?.specificTopic,
      grade: lessonPlan.parameters?.grade || classInfo?.grade,
      contentStandard: {
        main: lessonPlan.parameters?.sow?.contentStandard?.main || "",
        component: lessonPlan.parameters?.sow?.contentStandard?.comp || "",
      },
      learningStandard: {
        main: lessonPlan.parameters?.sow?.learningStandard?.main || "",
        component: lessonPlan.parameters?.sow?.learningStandard?.comp || "",
      },
      learningOutline: {
        pre: lessonPlan.parameters?.sow?.learningOutline?.pre || "",
        during: lessonPlan.parameters?.sow?.learningOutline?.during || "",
        post: lessonPlan.parameters?.sow?.learningOutline?.post || "",
      },
    };
  },

  /**
   * Extract activity configuration from lesson plan
   */
  extractActivityConfiguration: (lessonPlan) => {
    const activityConfig = lessonPlan.parameters?.activityConfiguration;

    if (!activityConfig) {
      return null;
    }

    return {
      activityType: activityConfig.type,
      ...activityConfig.parameters,
      configuredFor: activityConfig.configuredFor,
      configuredAt: activityConfig.configuredAt,
    };
  },

  /**
   * Validate lesson plan for assessment generation
   */
  validateLessonPlan: (lessonPlan) => {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (!lessonPlan._id) {
      errors.push("Lesson plan ID is required");
    }

    if (!lessonPlan.parameters?.specificTopic) {
      warnings.push("Lesson plan should have a specific topic");
    }

    if (!lessonPlan.parameters?.activityType) {
      errors.push("Activity type is required for assessment generation");
    }

    if (!lessonPlan.parameters?.activityConfiguration) {
      errors.push(
        "Activity configuration is required for assessment generation"
      );
    }

    if (!lessonPlan.plan?.learningObjective) {
      warnings.push("Learning objective helps create better assessments");
    }

    // Check class information
    if (!lessonPlan.classId) {
      warnings.push("Class information helps create targeted assessments");
    }

    // Check activity configuration validity
    const activityConfig = lessonPlan.parameters?.activityConfiguration;
    if (activityConfig) {
      if (!activityConfig.type) {
        errors.push("Activity configuration must specify activity type");
      }

      if (!activityConfig.parameters) {
        errors.push("Activity configuration must include parameters");
      }

      // Type-specific validations
      if (activityConfig.type === "essay") {
        if (!activityConfig.parameters?.essayType) {
          warnings.push(
            "Essay type would help create better essay assessments"
          );
        }
      }

      if (activityConfig.type === "assessment") {
        if (
          !activityConfig.parameters?.questionTypes ||
          activityConfig.parameters.questionTypes.length === 0
        ) {
          warnings.push("Question types would help create better assessments");
        }
      }
    }

    return {
      isValid: errors.length === 0,
      canGenerate: errors.length === 0,
      errors,
      warnings,
      hasConfiguration: !!activityConfig,
      activityType: lessonPlan.parameters?.activityType,
      configuredAt: activityConfig?.configuredAt,
    };
  },

  /**
   * Get default assessment settings based on activity type
   */
  getDefaultSettings: (activityType) => {
    const defaults = {
      activity: {
        duration: "30-45 minutes",
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

    return defaults[activityType] || defaults.activity;
  },

  /**
   * Format assessment data for display
   */
  formatAssessmentForDisplay: (assessment) => {
    return {
      id: assessment._id,
      title: assessment.title || assessment.assessmentTitle,
      description: assessment.description || assessment.assessmentDescription,
      activityType: assessment.activityType,
      assessmentType: assessment.assessmentType,
      status: assessment.status || "Generated",
      createdAt: assessment.createdAt,
      updatedAt: assessment.updatedAt,
      hasActivity: !!(
        assessment.generatedContent?.activityHTML ||
        assessment.generatedContent?.assessmentHTML
      ),
      hasRubric: !!(
        assessment.generatedContent?.rubricHTML ||
        assessment.generatedContent?.answerKeyHTML
      ),
      lessonPlanId: assessment.lessonPlanId,
      classId: assessment.classId,
      duration: assessment.duration,
      questionCount: assessment.questionCount,
      skills: assessment.skills || [],
      difficulty: assessment.difficulty,
    };
  },

  /**
   * Check if assessment content is available
   */
  getContentAvailability: (assessment) => {
    const generatedContent = assessment.generatedContent || {};

    return {
      hasStudentContent: !!(
        generatedContent.activityHTML || generatedContent.assessmentHTML
      ),
      hasTeacherContent: !!(
        generatedContent.rubricHTML || generatedContent.answerKeyHTML
      ),
      studentContentType: generatedContent.activityHTML
        ? "activity"
        : generatedContent.assessmentHTML
        ? "assessment"
        : null,
      teacherContentType: generatedContent.rubricHTML
        ? "rubric"
        : generatedContent.answerKeyHTML
        ? "answerKey"
        : null,
    };
  },

  /**
   * Generate assessment title from lesson plan
   */
  generateAssessmentTitle: (lessonPlan, activityType) => {
    const topic = lessonPlan.parameters?.specificTopic || "Lesson";
    const grade = lessonPlan.parameters?.grade || "Assessment";
    const typeLabel =
      {
        assessment: "Assessment",
        essay: "Essay",
        activity: "Activity",
        textbook: "Textbook Exercise",
      }[activityType] || "Assessment";

    return `${topic} - ${typeLabel} (${grade})`;
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

    if (
      formData.activityType === "assessment" &&
      (!formData.questionTypes || formData.questionTypes.length === 0)
    ) {
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
   * Format lesson plan for assessment generation
   */
  formatLessonPlanForAssessment: (lessonPlan) => {
    const activityConfig = lessonPlan.parameters?.activityConfiguration;

    return {
      id: lessonPlan._id,
      title: lessonPlan.parameters?.specificTopic || "Untitled Lesson",
      description: lessonPlan.plan?.learningObjective || "",
      activityType: lessonPlan.parameters?.activityType,
      hasConfiguration: !!activityConfig,
      canGenerateAssessment:
        !!activityConfig && !!lessonPlan.parameters?.activityType,
      class: lessonPlan.classId,
      grade: lessonPlan.parameters?.grade,
      subject: lessonPlan.classId?.subject || lessonPlan.parameters?.subject,
      createdAt: lessonPlan.createdAt,
      updatedAt: lessonPlan.updatedAt,
      configuration: activityConfig,
    };
  },
};

export default assessmentAPI;
