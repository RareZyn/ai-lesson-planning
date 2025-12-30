const express = require("express");
const router = express.Router();
const { globalSearch } = require("../controller/searchController");
const { protect } = require("../middleware/auth");

// Global search route
router.get("/", protect, globalSearch);

module.exports = router;
