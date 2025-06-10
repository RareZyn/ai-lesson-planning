// services/textbookService.js
import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL;

const textbookService = {
  // Get topics for a specific form
  getTopicsByForm: async (form) => {
    try {
      const response = await axios.get(`${BASE_URL}/textbook/${form}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching topics:", error);
      throw error;
    }
  },

  // Get all textbook data (if needed)
  getAllTextbookData: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/textbook/all`);
      return response.data;
    } catch (error) {
      console.error("Error fetching all textbook data:", error);
      throw error;
    }
  },
};

export default textbookService;
