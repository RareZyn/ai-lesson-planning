const express = require("express");
const router = express.Router();
const { globalSearch } = require("../controller/searchController");
const { protect, checkPermission } = require("../middleware/auth");
const { PERMISSIONS } = require("../config/permissions");

// Global search route
router.get("/", protect, checkPermission(PERMISSIONS.USER_READ), globalSearch);

module.exports = router;
