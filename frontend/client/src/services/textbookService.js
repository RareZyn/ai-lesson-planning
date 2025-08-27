// src/services/textbookService.js - Simple service with fallback data
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add auth token to requests
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

// Fallback topics data when API is not available
const fallbackTopics = {
  form1: [
    "Introduction to English",
    "Basic Grammar",
    "Simple Vocabulary",
    "Family and Friends",
    "School Life",
    "Hobbies and Interests",
    "Daily Routines",
    "Food and Drinks",
    "Colors and Numbers",
    "Animals and Pets",
  ],
  form2: [
    "Growing Up",
    "Nature and Environment",
    "Technology in Daily Life",
    "Cultural Diversity",
    "Health and Fitness",
    "Career Exploration",
    "Travel and Places",
    "Sports and Recreation",
    "Music and Arts",
    "Friendship and Relationships",
  ],
  form3: [
    "Global Issues",
    "Literature Appreciation",
    "Scientific Discoveries",
    "Social Responsibility",
    "Communication Skills",
    "Critical Thinking",
    "Environmental Awareness",
    "Leadership and Teamwork",
    "Media and Information",
    "Community Service",
  ],
  form4: [
    "People and Culture",
    "Science and Technology",
    "Consumer and Financial Awareness",
    "Sustainable Living",
    "Information Age",
    "Thinking Skills",
    "Global Citizenship",
    "Innovation and Change",
    "Health and Well-being",
    "Language Learning",
  ],
  form5: [
    "Personal Development",
    "Social Issues",
    "Environmental Awareness",
    "Globalization",
    "Innovation and Creativity",
    "Future Perspectives",
    "Economic Understanding",
    "Political Awareness",
    "Ethical Decision Making",
    "Career Planning",
  ],
};

const textbookService = {
  /**
   * Get topics by form level
   * Falls back to predefined topics if API is not available
   */
  getTopicsByForm: async (form) => {
    try {
      // Try to fetch from API first
      const response = await apiClient.get(`/textbook/topics/${form}`);

      if (response.data && response.data.success) {
        return {
          success: true,
          topics: response.data.topics || [],
        };
      } else {
        throw new Error("API returned unsuccessful response");
      }
    } catch (error) {
      console.warn(
        `Textbook API not available for form ${form}, using fallback topics:`,
        error.message
      );

      // Return fallback topics
      return {
        success: true,
        topics: fallbackTopics[form] || fallbackTopics.form4,
        isFallback: true,
      };
    }
  },

  /**
   * Get all available forms
   */
  getAvailableForms: async () => {
    try {
      const response = await apiClient.get("/textbook/forms");

      if (response.data && response.data.success) {
        return {
          success: true,
          forms: response.data.forms || [],
        };
      } else {
        throw new Error("API returned unsuccessful response");
      }
    } catch (error) {
      console.warn(
        "Textbook forms API not available, using fallback:",
        error.message
      );

      // Return fallback forms
      return {
        success: true,
        forms: [
          { value: "form1", label: "Form 1" },
          { value: "form2", label: "Form 2" },
          { value: "form3", label: "Form 3" },
          { value: "form4", label: "Form 4" },
          { value: "form5", label: "Form 5" },
        ],
        isFallback: true,
      };
    }
  },

  /**
   * Get textbook content by form and topic
   */
  getTextbookContent: async (form, topic) => {
    try {
      const response = await apiClient.get(
        `/textbook/content/${form}/${encodeURIComponent(topic)}`
      );

      if (response.data && response.data.success) {
        return {
          success: true,
          content: response.data.content || {},
        };
      } else {
        throw new Error("API returned unsuccessful response");
      }
    } catch (error) {
      console.warn(
        `Textbook content API not available for ${form}/${topic}, using fallback:`,
        error.message
      );

      // Return minimal fallback content
      return {
        success: true,
        content: {
          title: topic,
          form: form,
          description: `Content for ${topic} in ${form.toUpperCase()}`,
          pages: "N/A",
          exercises: [],
        },
        isFallback: true,
      };
    }
  },

  /**
   * Search textbook content
   */
  searchContent: async (query, form = null) => {
    try {
      const params = { query };
      if (form) params.form = form;

      const response = await apiClient.get("/textbook/search", { params });

      if (response.data && response.data.success) {
        return {
          success: true,
          results: response.data.results || [],
        };
      } else {
        throw new Error("API returned unsuccessful response");
      }
    } catch (error) {
      console.warn(
        `Textbook search API not available for query "${query}", using fallback:`,
        error.message
      );

      // Return empty search results as fallback
      return {
        success: true,
        results: [],
        isFallback: true,
      };
    }
  },

  /**
   * Get activity suggestions for a topic
   */
  getActivitySuggestions: async (form, topic) => {
    try {
      const response = await apiClient.get(
        `/textbook/activities/${form}/${encodeURIComponent(topic)}`
      );

      if (response.data && response.data.success) {
        return {
          success: true,
          activities: response.data.activities || [],
        };
      } else {
        throw new Error("API returned unsuccessful response");
      }
    } catch (error) {
      console.warn(
        `Activity suggestions API not available for ${form}/${topic}, using fallback:`,
        error.message
      );

      // Return fallback activity suggestions
      const fallbackActivities = [
        "Reading Comprehension Questions",
        "Vocabulary Exercises",
        "Grammar Practice",
        "Writing Activities",
        "Group Discussion",
        "Role Play",
        "Project Work",
      ];

      return {
        success: true,
        activities: fallbackActivities,
        isFallback: true,
      };
    }
  },
};

export default textbookService;
