// src/services/materialService.js
import axios from 'axios';

const API_URL = '/api/materials';

// Helper to get auth header
const getAuthConfig = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
    },
});



export const getMaterials = async () => {
    try {
        const response = await axios.get(API_URL, { headers: getAuthConfig().headers });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getMaterialById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`, { headers: getAuthConfig().headers });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const uploadMaterial = async (data, onProgress) => {
    try {
        const response = await axios.post(`${API_URL}/upload`, data, {
            headers: getAuthConfig().headers,
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteMaterial = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthConfig().headers });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateMaterial = async (id, data) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthConfig().headers });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
