const express = require("express");
const {
  generateTeacherRegistrationToken,
  getPendingLessons,
  getTeachersBySchool
} = require("../controller/adminController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Allow only school_admin or super_admin to generate teacher registration tokens
router.post(
  "/generate-teacher-token",
  protect,
  authorize(
    "school_admin",
    "super_admin",
    "english_head",
    "math_head"),
  generateTeacherRegistrationToken
);

router.get(
  "/teachers",
  protect,
  authorize(
    "school_admin",
    "super_admin",
    "principal",
    "math_head",
    "english_head",
    "science_head"),
  getTeachersBySchool
)

module.exports = router;
