const express = require("express");
const { protect, checkPermission } = require("../middleware/auth");
const { PERMISSIONS } = require("../config/permissions");
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteAll,
} = require("../controller/notificationController");

const router = express.Router();

router.use(protect); // All notification routes are protected

// Using USER permissions for personal notification management
router.get("/", checkPermission(PERMISSIONS.NOTIFICATION_READ), getNotifications);
router.put("/:id/read", checkPermission(PERMISSIONS.NOTIFICATION_MARK_READ), markAsRead);
router.put("/mark-all-read", checkPermission(PERMISSIONS.NOTIFICATION_MARK_ALL_READ), markAllAsRead);
router.delete("/clear-all", checkPermission(PERMISSIONS.NOTIFICATION_DELETE), deleteAll);

module.exports = router;
