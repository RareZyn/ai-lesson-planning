const Notification = require("../model/Notification");

// Get all notifications for the current user
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .sort({ createdAt: -1 })
            .populate("sender", "name avatar")
            .populate("lessonId", "parameters.specificTopic");

        res.status(200).json({
            success: true,
            data: notifications,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error: Unable to fetch notifications",
        });
    }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        // Ensure the user owns the notification
        if (notification.recipient.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Not authorized to access this notification",
            });
        }

        notification.isRead = true;
        await notification.save();

        // Emit socket event to update clients
        const io = req.app.get("io");
        if (io) {
            io.to(`user_${req.user.id}`).emit("notification_read", notification._id);
        }

        res.status(200).json({
            success: true,
            data: notification,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error: Unable to update notification",
        });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, isRead: false },
            { isRead: true }
        );

        // Emit socket event to update clients
        const io = req.app.get("io");
        if (io) {
            io.to(`user_${req.user.id}`).emit("all_notifications_read");
        }

        res.status(200).json({
            success: true,
            message: "All notifications marked as read",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error: Unable to update notifications",
        });
    }
};

// Delete all notifications for the current user
exports.deleteAll = async (req, res) => {
    try {
        await Notification.deleteMany({ recipient: req.user.id });

        res.status(200).json({
            success: true,
            message: "All notifications cleared",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error: Unable to delete notifications",
        });
    }
};
