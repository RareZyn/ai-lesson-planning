// frontend/client/src/services/studentService.js
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

// Create axios instance
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/students`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 30000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Student API Error:", error);
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export const studentAPI = {
  /**
   * Add a new student to a class
   * @param {Object} studentData - Student data
   * @returns {Promise<Object>}
   */
  addStudent: async (studentData) => {
    try {
      const response = await apiClient.post("/", studentData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to add student",
        error: error.response?.data || error,
      };
    }
  },

  /**
   * Get all students in a class
   * @param {string} classId - Class ID
   * @param {Object} params - Query parameters (status, search, sortBy, sortOrder)
   * @returns {Promise<Object>}
   */
  getStudentsByClass: async (classId, params = {}) => {
    try {
      const response = await apiClient.get(`/${classId}`, { params });
      return {
        success: true,
        data: response.data.data,
        count: response.data.count,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch students",
        error: error.response?.data || error,
      };
    }
  },

  /**
   * Get single student by ID
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>}
   */
  getStudentById: async (studentId) => {
    try {
      const response = await apiClient.get(`/detail/${studentId}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch student",
        error: error.response?.data || error,
      };
    }
  },

  /**
   * Update student information
   * @param {string} studentId - Student ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>}
   */
  updateStudent: async (studentId, updateData) => {
    try {
      const response = await apiClient.put(`/detail/${studentId}`, updateData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update student",
        error: error.response?.data || error,
      };
    }
  },

  /**
   * Delete a student
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>}
   */
  deleteStudent: async (studentId) => {
    try {
      const response = await apiClient.delete(`/detail/${studentId}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to delete student",
        error: error.response?.data || error,
      };
    }
  },

  /**
   * Search students across all classes
   * @param {string} query - Search query
   * @returns {Promise<Object>}
   */
  searchStudents: async (query) => {
    try {
      const response = await apiClient.get("/search", { params: { query } });
      return {
        success: true,
        data: response.data.data,
        count: response.data.count,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to search students",
        error: error.response?.data || error,
      };
    }
  },

  /**
   * Bulk import students to a class
   * @param {string} classId - Class ID
   * @param {Array} students - Array of student objects
   * @returns {Promise<Object>}
   */
  bulkImport: async (classId, students) => {
    try {
      const response = await apiClient.post("/bulk-import", {
        classId,
        students,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to import students",
        error: error.response?.data || error,
      };
    }
  },

  /**
   * Update student performance stats
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>}
   */
  updatePerformanceStats: async (studentId) => {
    try {
      const response = await apiClient.put(`/${studentId}/performance`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to update performance stats",
        error: error.response?.data || error,
      };
    }
  },
};

// Utility functions
export const studentUtils = {
  /**
   * Format student display name
   */
  formatDisplayName: (student) => {
    return `${student.name} (${student.studentId})`;
  },

  /**
   * Get status badge color
   */
  getStatusBadge: (status) => {
    const badges = {
      active: { color: "success", label: "Active" },
      inactive: { color: "secondary", label: "Inactive" },
      graduated: { color: "info", label: "Graduated" },
      transferred: { color: "warning", label: "Transferred" },
    };
    return badges[status] || { color: "secondary", label: status };
  },

  /**
   * Validate student data
   */
  validateStudentData: (data) => {
    const errors = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push("Student name is required");
    }

    if (!data.studentId || data.studentId.trim().length === 0) {
      errors.push("Student ID is required");
    }

    if (!data.classId) {
      errors.push("Class is required");
    }

    if (!data.grade) {
      errors.push("Grade is required");
    }

    if (data.email && !isValidEmail(data.email)) {
      errors.push("Invalid email format");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Format student data for submission
   */
  formatForSubmission: (data) => {
    return {
      name: data.name.trim(),
      studentId: data.studentId.trim().toUpperCase(),
      email: data.email?.trim() || "",
      classId: data.classId,
      grade: data.grade,
      rollNumber: data.rollNumber || null,
      dateOfBirth: data.dateOfBirth || null,
      parentContact: data.parentContact || {},
      notes: data.notes?.trim() || "",
    };
  },

  /**
   * Get performance color based on average score
   */
  getPerformanceColor: (averageScore) => {
    if (averageScore >= 80) return "success";
    if (averageScore >= 60) return "warning";
    return "danger";
  },
};

// Helper function for email validation
const isValidEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

export default studentAPI;
