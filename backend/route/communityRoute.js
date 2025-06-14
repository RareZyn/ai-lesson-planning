// routes/communityRoutes.js - Updated with bookmark routes
const express = require("express");
const router = express.Router();
const {
  getAllLessonPlans,
  getUserLessonPlans,
  getUserBookmarks,
  toggleBookmark,
  shareLessonPlanToCommunity,
  unshareLessonPlanFromCommunity,
  getCommunityLessonPlans,
  toggleLikeLessonPlan,
  downloadLessonPlan,
  getCommunityStats,
} = require("../controller/communityController");

// Existing routes
router.get("/all-lessons", getAllLessonPlans);
router.get("/my-lessons", getUserLessonPlans);
router.get("/shared-lessons", getCommunityLessonPlans);
router.put("/share/:id", shareLessonPlanToCommunity);
router.put("/unshare/:id", unshareLessonPlanFromCommunity);
router.put("/like/:id", toggleLikeLessonPlan);
router.post("/download/:id", downloadLessonPlan);
router.get("/stats", getCommunityStats);

// New bookmark routes
router.get("/bookmarks", getUserBookmarks);
router.put("/bookmark/:id", toggleBookmark);

module.exports = router;
