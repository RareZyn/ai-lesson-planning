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

export const gradingService = {
  /**
   * Process and grade SPM Paper 1 answer sheet (MCQ bubble detection)
   * @param {string} image - Base64 encoded image of answer sheet
   * @param {string} assessmentId - Assessment ID
   * @param {string} classId - Class ID
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>} Processing and grading results
   */
  processAndGradeSpmAnswerSheet: async (image, assessmentId, classId, studentId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/grading/process-and-grade-spm`,
        {
          image,
          assessmentId,
          classId,
          studentId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          withCredentials: true,
        }
      );
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error("SPM answer sheet processing error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to process answer sheet",
        error: error.response?.data?.error,
      };
    }
  },

  scoreSubmission: async (submissionId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/grading/score-submission/${submissionId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          withCredentials: true,
        }
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Grading failed",
      };
    }
  },

  scoreAnswer: async (submissionId, questionNumber) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/grading/score-answer/${submissionId}/${questionNumber}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          withCredentials: true,
        }
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Grading failed",
      };
    }
  },

  batchGrade: async (submissionIds) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/grading/batch-grade`,
        { submissionIds },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          withCredentials: true,
        }
      );
      return {
        success: true,
        data: response.data.data,
        summary: response.data.summary,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Batch grade failed",
      };
    }
  },

  getGradingStatus: async (submissionId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/grading/status/${submissionId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          withCredentials: true,
        }
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch status",
      };
    }
  },
};

export const manualEditService = {
  editText: async (submissionId, questionNumber, data) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/manual-edit/${submissionId}/edit-text/${questionNumber}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          withCredentials: true,
        }
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Edit failed",
      };
    }
  },

  adjustScore: async (submissionId, questionNumber, data) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/manual-edit/${submissionId}/adjust-score/${questionNumber}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          withCredentials: true,
        }
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Adjust failed",
      };
    }
  },

  bulkEdit: async (submissionId, edits) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/manual-edit/${submissionId}/bulk-edit`,
        { edits },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          withCredentials: true,
        }
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Bulk edit failed",
      };
    }
  },

  resetAdjustments: async (submissionId, questionNumber) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/manual-edit/${submissionId}/reset/${questionNumber}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          withCredentials: true,
        }
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Reset failed",
      };
    }
  },
};

export const gradingUtils = {
  getScoreColor: (percentage) => {
    if (percentage >= 80) return "success";
    if (percentage >= 60) return "warning";
    return "danger";
  },
  formatScore: (score, maxScore) => `${score}/${maxScore}`,
  calculatePercentage: (score, maxScore) =>
    maxScore ? Math.round((score / maxScore) * 100) : 0,
  getGradeLetter: (percentage) => {
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  },
};

// ============================================================================
// FILE 3: frontend/client/src/services/reviewServiceClient.js
// ============================================================================
export const reviewService = {
  getSubmissionsForReview: async (params = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/review/submissions`, {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        withCredentials: true,
      });
      return {
        success: true,
        data: response.data.data,
        stats: response.data.stats,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch",
      };
    }
  },

  getLowConfidenceAnswers: async (params = {}) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/review/low-confidence`,
        {
          params,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          withCredentials: true,
        }
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch",
      };
    }
  },

  getReviewStatistics: async (params = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/review/statistics`, {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        withCredentials: true,
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch stats",
      };
    }
  },

  markAsReviewed: async (submissionId, data) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/review/${submissionId}/mark-reviewed`,
        data,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          withCredentials: true,
        }
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Review failed",
      };
    }
  },

  flagForRegrade: async (submissionId, data) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/review/${submissionId}/flag-regrade`,
        data,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          withCredentials: true,
        }
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Flag failed",
      };
    }
  },

  bulkReview: async (submissionIds, data) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/review/bulk-review`,
        {
          submissionIds,
          ...data,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          withCredentials: true,
        }
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Bulk review failed",
      };
    }
  },
};

export const reviewUtils = {
  getConfidenceBadge: (confidence) => {
    if (confidence >= 0.8) return { color: "success", label: "High" };
    if (confidence >= 0.6) return { color: "warning", label: "Medium" };
    return { color: "danger", label: "Low" };
  },
  getStatusBadge: (status) => {
    const badges = {
      pending: { color: "secondary", label: "Pending" },
      processing_ocr: { color: "info", label: "Processing" },
      completed: { color: "success", label: "Completed" },
      requires_review: { color: "warning", label: "Review Required" },
      error: { color: "danger", label: "Error" },
    };
    return badges[status] || { color: "secondary", label: status };
  },
};
