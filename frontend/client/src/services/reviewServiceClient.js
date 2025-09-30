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
