// routes/communityRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAllLessonPlans,
  getUserLessonPlans,
  shareLessonPlanToCommunity,
  unshareLessonPlanFromCommunity,
  getCommunityLessonPlans,
  toggleLikeLessonPlan,
  downloadLessonPlan,
  getCommunityStats,
} = require("../controller/communityController");
router.get("/all-lessons", getAllLessonPlans);
router.get("/my-lessons", getUserLessonPlans);
router.get("/shared-lessons", getCommunityLessonPlans);
router.put("/share/:id", shareLessonPlanToCommunity);
router.put("/unshare/:id", unshareLessonPlanFromCommunity);
router.put("/like/:id", toggleLikeLessonPlan);
router.post("/download/:id", downloadLessonPlan);
router.get("/stats", getCommunityStats);

module.exports = router;
