import axios from "axios";

const API_URL = "/api/notifications";

// Get all notifications for the current user
const getNotifications = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

// Mark a specific notification as read
const markAsRead = async (id) => {
    const response = await axios.put(`${API_URL}/${id}/read`);
    return response.data;
};

// Mark all notifications as read
const markAllAsRead = async () => {
    const response = await axios.put(`${API_URL}/mark-all-read`);
    return response.data;
};

// Delete all notifications
const deleteAllNotifications = async () => {
    const response = await axios.delete(`${API_URL}/clear-all`);
    return response.data;
};

const notificationService = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteAllNotifications,
};

export default notificationService;
