import axios from 'axios';

export const generateLesson = async (formData) => {
    // This calls your own backend, which then securely calls Google
    const response = await axios.post('/api/lesson/generate', formData);
    
    return response.data; // Return the plan object
};