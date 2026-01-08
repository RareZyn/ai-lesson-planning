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
router.get("/", checkPermission(PERMISSIONS.USER_READ), getNotifications);
router.put("/:id/read", checkPermission(PERMISSIONS.USER_UPDATE), markAsRead);
router.put("/mark-all-read", checkPermission(PERMISSIONS.USER_UPDATE), markAllAsRead);
router.delete("/clear-all", checkPermission(PERMISSIONS.USER_DELETE), deleteAll);

module.exports = router;
