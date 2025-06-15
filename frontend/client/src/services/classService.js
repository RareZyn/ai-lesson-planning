// src/services/classService.js
import axios from 'axios';

const API_URL = '/api/classes';

// Helper to get the authorization headers
const getAuthConfig = () => ({
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
});

/**
 * Fetches all classes for the current user.
 * @returns {Promise<Array>} A promise that resolves to an array of classes.
 */
export const getAllClasses = async () => {
  const response = await axios.get(API_URL, getAuthConfig());
  return response.data?.data || []; // Safely access the nested data array
};

/**
 * Creates a new class.
 * @param {object} classData - The data for the new class.
 * @returns {Promise<object>} A promise that resolves to the newly created class.
 */
export const createClass = async (classData) => {
  const response = await axios.post(API_URL, classData, getAuthConfig());
  return response.data;
};

export const updateClass = async (id, classData) => {
    try {
        const response = await axios.put(`/api/classes/${id}`, classData, getAuthConfig());
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Could not update class.');
    }
};

export const deleteClass = async (id) => {
    try {
      console.log("Deleting class with ID:", id);
        const response = await axios.delete(`/api/classes/${id}`, getAuthConfig());
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Could not delete class.');
    }
};

/**
 * Fetches a single class by its ID.
 * @param {string} classId - The ID of the class to fetch.
 * @returns {Promise<object>}
 */
export const getClassById = async (classId) => {
    try {
        const response = await axios.get(`${API_URL}/${classId}`, getAuthConfig());
        return response.data;
    } catch (error) {
        console.error("Error fetching class by ID:", error.response?.data);
        throw new Error(error.response?.data?.message || 'Could not fetch class details.');
    }
};

/**
 * Fetches the 5 most recently updated classes for the user.
 * @returns {Promise<Array>} A promise that resolves to an array of up to 5 classes.
 */
export const getRecentClasses = async () => {
    try {
        const response = await axios.get('/api/classes/recent', getAuthConfig());
        return response.data.data;
    } catch (error) {
        console.error("Error fetching recent classes:", error.response?.data);
        throw new Error(error.response?.data?.message || 'Could not fetch recent classes.');
    }
};