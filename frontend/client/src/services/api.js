// src/services/api.js
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("authToken");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  // Modified: Register new teacher with token (replace old register for teachers)
  registerTeacherWithToken: async (teacherData) => {
    const response = await api.post("/auth/register-teacher", teacherData); // Make sure this matches your backend route
    if (response.data.token) {
      localStorage.setItem("authToken", response.data.token);
    }
    return response.data;
  },

  // Login user (this should work for both teachers and admins after they're registered)
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    if (response.data.token) {
      localStorage.setItem("authToken", response.data.token);
    }
    return response.data;
  },

  // Firebase user (used during Google sign-in)
  findOrCreateFirebaseUser: async (firebaseUserData) => {
    const response = await api.post("/auth/firebase-user", firebaseUserData);
    if (response.data.token) {
      localStorage.setItem("authToken", response.data.token);
    }
    return response.data;
  },

  // Google OAuth for new teachers (now accepts token)
  googleAuthWithToken: async (googleDataWithToken) => {
    const response = await api.post("/auth/google-register-teacher", googleDataWithToken); // Make sure this matches your backend route
    if (response.data.token) {
      localStorage.setItem("authToken", response.data.token);
    }
    return response.data;
  },

  // --- Admin Specific API Calls (New) ---
  // A super admin might register initial school admins
  // registerSchoolAdmin: async (adminData) => { /* ... */ },
  // A school admin generates teacher registration tokens
  generateTeacherToken: async (tokenConfig) => {
    const response = await api.post("/admin/generate-teacher-token", tokenConfig);
    console.log("generateTeacherToken response:", response);
    return response.data;
  },


  // Get current user (this should return role and schoolId now)
  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put("/auth/profile", profileData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.put("/auth/password", passwordData);
    return response.data;
  },

  // Get Gemini API key
  getGeminiApiKey: async () => {
    const response = await api.get("/auth/gemini-key");
    return response.data;
  },

  // Update Gemini API key
  updateGeminiApiKey: async (apiKey) => {
    const response = await api.put("/auth/gemini-key", { apiKey });
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("authToken");
    }
  },
};

export default api;