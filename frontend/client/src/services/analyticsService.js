// frontend/client/src/services/analyticsService.js
import axios from "axios";

const API_URL = "/api/analytics";

// Cache configuration
const CACHE_PREFIX = "analytics_cache_";
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Cache utility functions
 */
const cacheUtils = {
  /**
   * Generate a cache key based on endpoint and parameters
   */
  generateKey: (endpoint, params = {}) => {
    const paramString = Object.keys(params)
      .filter((key) => params[key] !== null && params[key] !== undefined)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&");
    return `${CACHE_PREFIX}${endpoint}_${paramString}`;
  },

  /**
   * Get cached data if valid (not expired)
   */
  get: (key) => {
    try {
      const cached = sessionStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp, ttl } = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid
      if (now - timestamp < ttl) {
        return data;
      }

      // Cache expired, remove it
      sessionStorage.removeItem(key);
      return null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Set cache data with TTL
   */
  set: (key, data, ttl = DEFAULT_CACHE_TTL) => {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      sessionStorage.setItem(key, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error("[Cache] Error storing cache:", error);
      // If storage is full, clear old analytics cache
      if (error.name === "QuotaExceededError") {
        cacheUtils.clearAll();
      }
    }
  },

  /**
   * Clear specific cache entry
   */
  clear: (key) => {
    sessionStorage.removeItem(key);
  },

  /**
   * Clear all analytics cache
   */
  clearAll: () => {
    const keys = Object.keys(sessionStorage).filter((key) =>
      key.startsWith(CACHE_PREFIX)
    );
    keys.forEach((key) => sessionStorage.removeItem(key));
  },

  /**
   * Clear cache for a specific class
   */
  clearForClass: (classId) => {
    const keys = Object.keys(sessionStorage).filter(
      (key) => key.startsWith(CACHE_PREFIX) && key.includes(classId)
    );
    keys.forEach((key) => sessionStorage.removeItem(key));
  },
};

/**
 * Get class performance analytics (with caching)
 * @param {string} classId - Class ID
 * @param {object} filters - Filter options
 * @param {boolean} forceRefresh - Force fetch from server, bypass cache
 */
export const getClassAnalytics = async (classId, filters = {}, forceRefresh = false) => {
  const cacheKey = cacheUtils.generateKey(`class_${classId}`, filters);

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cachedData = cacheUtils.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  try {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.topic) params.append("topic", filters.topic);
    if (filters.assessmentType) params.append("assessmentType", filters.assessmentType);

    const response = await axios.get(`${API_URL}/class/${classId}?${params.toString()}`, {
      withCredentials: true,
    });

    // Cache the response
    cacheUtils.set(cacheKey, response.data);

    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get all class analytics data in a single request (optimized)
 * Combines: class analytics, missed questions, and available topics
 * @param {string} classId - Class ID
 * @param {object} filters - Filter options
 * @param {boolean} forceRefresh - Force fetch from server, bypass cache
 */
export const getClassAnalyticsCombined = async (classId, filters = {}, forceRefresh = false) => {
  const cacheKey = cacheUtils.generateKey(`class_combined_${classId}`, filters);

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cachedData = cacheUtils.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  try {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.topic) params.append("topic", filters.topic);
    if (filters.assessmentType) params.append("assessmentType", filters.assessmentType);

    const response = await axios.get(`${API_URL}/class/${classId}/combined?${params.toString()}`, {
      withCredentials: true,
    });

    // Cache the response
    cacheUtils.set(cacheKey, response.data);

    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get individual student progress (with caching)
 */
export const getStudentProgress = async (studentId, filters = {}, forceRefresh = false) => {
  const cacheKey = cacheUtils.generateKey(`student_${studentId}`, filters);

  if (!forceRefresh) {
    const cachedData = cacheUtils.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  try {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.assessmentType) params.append("assessmentType", filters.assessmentType);

    const response = await axios.get(`${API_URL}/student/${studentId}?${params.toString()}`, {
      withCredentials: true,
    });

    cacheUtils.set(cacheKey, response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get frequently missed questions (with caching)
 */
export const getFrequentlyMissedQuestions = async (classId, assessmentId = null, forceRefresh = false) => {
  const cacheKey = cacheUtils.generateKey(
    assessmentId ? `missed_assessment_${assessmentId}` : `missed_class_${classId}`,
    {}
  );

  if (!forceRefresh) {
    const cachedData = cacheUtils.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  try {
    const endpoint = assessmentId
      ? `${API_URL}/missed-questions/assessment/${assessmentId}`
      : `${API_URL}/missed-questions/${classId}`;

    const response = await axios.get(endpoint, {
      withCredentials: true,
    });

    cacheUtils.set(cacheKey, response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get class students list (with caching)
 */
export const getClassStudentsList = async (classId, forceRefresh = false) => {
  const cacheKey = cacheUtils.generateKey(`students_${classId}`, {});

  if (!forceRefresh) {
    const cachedData = cacheUtils.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  try {
    const response = await axios.get(`${API_URL}/students/${classId}`, {
      withCredentials: true,
    });

    cacheUtils.set(cacheKey, response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get available topics for filtering (with caching)
 */
export const getAvailableTopics = async (classId, forceRefresh = false) => {
  const cacheKey = cacheUtils.generateKey(`topics_${classId}`, {});

  if (!forceRefresh) {
    const cachedData = cacheUtils.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  try {
    const response = await axios.get(`${API_URL}/topics/${classId}`, {
      withCredentials: true,
    });

    cacheUtils.set(cacheKey, response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Generate performance report (no caching - always fresh)
 */
export const generateReport = async (reportConfig) => {
  try {
    const response = await axios.post(`${API_URL}/report`, reportConfig, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Clear all analytics cache
 */
export const clearAnalyticsCache = () => {
  cacheUtils.clearAll();
};

/**
 * Clear cache for a specific class
 */
export const clearClassCache = (classId) => {
  cacheUtils.clearForClass(classId);
};
