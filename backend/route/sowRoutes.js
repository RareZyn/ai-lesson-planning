// backend/route/sowRoutes.js - Updated with batch route

const express = require("express");
const {
  createSow,
  createSowBatch,
  getSowByGrade,
} = require("../controller/sowController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect); // Protect all routes in this router
router.get("/:grade", getSowByGrade);
router.post("/", createSow);
router.post("/batch", createSowBatch); // NEW: Batch upload route

module.exports = router;
