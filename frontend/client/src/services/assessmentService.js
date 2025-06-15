// src/services/assessmentService.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;

// Create axios instance with interceptors
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Assessment API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/';
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
      const response = await apiClient.post('/assessment/fullLessonPlanner', lessonData);
      return response.data;
    } catch (error) {
      console.error('Error generating full lesson planner:', error);
      throw error;
    }
  },

  // Generate activity and rubric based on lesson plan
  generateActivityAndRubric: async (assessmentData) => {
    try {
      const response = await apiClient.post('/assessment/generateActivityAndRubric', assessmentData);
      return response.data;
    } catch (error) {
      console.error('Error generating activity and rubric:', error);
      throw error;
    }
  },

  // Generate essay assessment
  generateEssayAssessment: async (essayData) => {
    try {
      const response = await apiClient.post('/assessment/generateEssayAssessment', essayData);
      return response.data;
    } catch (error) {
      console.error('Error generating essay assessment:', error);
      throw error;
    }
  },

  // Generate textbook activity
  generateTextbookActivity: async (textbookData) => {
    try {
      const response = await apiClient.post('/assessment/generateTextbookActivity', textbookData);
      return response.data;
    } catch (error) {
      console.error('Error generating textbook activity:', error);
      throw error;
    }
  },

  // Save generated assessment to database (you might need this)
  saveAssessment: async (assessmentData) => {
    try {
      const response = await apiClient.post('/assessment/save', assessmentData);
      return response.data;
    } catch (error) {
      console.error('Error saving assessment:', error);
      throw error;
    }
  },

  // Get user's assessments
  getUserAssessments: async (params = {}) => {
    try {
      const response = await apiClient.get('/assessment/my-assessments', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user assessments:', error);
      throw error;
    }
  },

  // Get assessment by ID
  getAssessmentById: async (assessmentId) => {
    try {
      const response = await apiClient.get(`/assessment/${assessmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching assessment:', error);
      throw error;
    }
  },

  // Delete assessment
  deleteAssessment: async (assessmentId) => {
    try {
      const response = await apiClient.delete(`/assessment/${assessmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting assessment:', error);
      throw error;
    }
  },
};

export default assessmentAPI;