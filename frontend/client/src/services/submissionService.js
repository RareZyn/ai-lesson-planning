import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/answers`,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 120000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export const submissionService = {
  submitAnswer: async (data) => {
    try {
      const response = await apiClient.post("/submit", data);
      return {
        success: true,
        data: response.data.data,
        submissionId: response.data.submissionId,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to submit",
      };
    }
  },

  batchSubmit: async (submissions) => {
    try {
      const response = await apiClient.post("/batch-submit", { submissions });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Batch submit failed",
      };
    }
  },

  getSubmissionById: async (id) => {
    try {
      const response = await apiClient.get(`/${id}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch",
      };
    }
  },

  getSubmissionsByAssessment: async (assessmentId, params = {}) => {
    try {
      const response = await apiClient.get(`/assessment/${assessmentId}`, {
        params,
      });
      return {
        success: true,
        data: response.data.data,
        count: response.data.count,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch",
      };
    }
  },

  getSubmissionsByClass: async (classId, params = {}) => {
    try {
      const response = await apiClient.get(`/class/${classId}`, { params });
      return {
        success: true,
        data: response.data.data,
        count: response.data.count,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch",
      };
    }
  },

  deleteSubmission: async (id) => {
    try {
      await apiClient.delete(`/${id}`);
      return { success: true, message: "Submission deleted" };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Delete failed",
      };
    }
  },
};

export const submissionUtils = {
  getStatusColor: (status) => {
    const colors = {
      pending: "secondary",
      processing_ocr: "info",
      processing_grading: "info",
      completed: "success",
      requires_review: "warning",
      error: "danger",
    };
    return colors[status] || "secondary";
  },

  calculateProgress: (submission) => {
    if (!submission?.answers) return 0;
    const total = submission.answers.length * 2;
    let completed = 0;
    submission.answers.forEach((a) => {
      if (["ocr_completed", "graded", "reviewed"].includes(a.status))
        completed++;
      if (["graded", "reviewed"].includes(a.status)) completed++;
    });
    return Math.round((completed / total) * 100);
  },
};
