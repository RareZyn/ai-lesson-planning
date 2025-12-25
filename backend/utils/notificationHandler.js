const Notification = require("../model/Notification");

/**
 * Creates notification(s) in DB and emits real-time socket events.
 * @param {Object} io - Socket.io instance
 * @param {Object|Array} data - Notification object or array of objects
 * @returns {Promise<Array|Object|null>} Created notification(s) or null on error
 */
const createNotification = async (io, data) => {
    try {
        let notifications = [];

        // 1. Save to MongoDB
        if (Array.isArray(data)) {
            if (data.length === 0) return [];
            notifications = await Notification.insertMany(data);
        } else {
            const notif = await Notification.create(data);
            notifications = [notif];
        }

        // 2. Emit Socket Events
        if (io) {
            notifications.forEach((notif) => {
                // Emit to the specific user's room
                io.to(`user_${notif.recipient}`).emit("new_notification", notif);
            });
        }

        return Array.isArray(data) ? notifications : notifications[0];
    } catch (error) {
        console.error("❌ Notification Handler Error:", error);
        // Return null so we don't break the main request flow
        return null;
    }
};

module.exports = { createNotification };
