const express = require("express");
const { protect } = require("../middleware/auth");
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteAll,
} = require("../controller/notificationController");

const router = express.Router();

router.use(protect); // All notification routes are protected

router.get("/", getNotifications);
router.put("/:id/read", markAsRead);
router.put("/mark-all-read", markAllAsRead);
router.delete("/clear-all", deleteAll);

module.exports = router;
