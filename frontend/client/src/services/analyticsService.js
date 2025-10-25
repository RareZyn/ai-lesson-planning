// frontend/client/src/services/analyticsService.js
import axios from "axios";

const API_URL = "/api/analytics";

/**
 * Get class performance analytics
 */
export const getClassAnalytics = async (classId, filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.topic) params.append("topic", filters.topic);
    if (filters.assessmentType) params.append("assessmentType", filters.assessmentType);

    const response = await axios.get(`${API_URL}/class/${classId}?${params.toString()}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching class analytics:", error);
    throw error;
  }
};

/**
 * Get individual student progress
 */
export const getStudentProgress = async (studentId, filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.assessmentType) params.append("assessmentType", filters.assessmentType);

    const response = await axios.get(`${API_URL}/student/${studentId}?${params.toString()}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching student progress:", error);
    throw error;
  }
};

/**
 * Get frequently missed questions
 */
export const getFrequentlyMissedQuestions = async (classId, assessmentId = null) => {
  try {
    const endpoint = assessmentId
      ? `${API_URL}/missed-questions/assessment/${assessmentId}`
      : `${API_URL}/missed-questions/${classId}`;

    const response = await axios.get(endpoint, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching missed questions:", error);
    throw error;
  }
};

/**
 * Get class students list
 */
export const getClassStudentsList = async (classId) => {
  try {
    const response = await axios.get(`${API_URL}/students/${classId}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching students list:", error);
    throw error;
  }
};

/**
 * Get available topics for filtering
 */
export const getAvailableTopics = async (classId) => {
  try {
    const response = await axios.get(`${API_URL}/topics/${classId}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching topics:", error);
    throw error;
  }
};

/**
 * Generate performance report
 */
export const generateReport = async (reportConfig) => {
  try {
    const response = await axios.post(`${API_URL}/report`, reportConfig, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error generating report:", error);
    throw error;
  }
};
