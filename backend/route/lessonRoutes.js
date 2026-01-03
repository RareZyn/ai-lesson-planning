const express = require("express");
const router = express.Router();
const {
  createLesson,
  saveLessonPlan,
  getLessonPlanById,
  getAllUserLessonPlans,
  getRecentLessonPlans,
  deleteLessonPlan,
  getLessonPlansByClass,
  updateLessonPlan,
  enhanceLessonSection,
  sendForApproval,
  approveLesson,
  rejectLesson,
  getPendingLessons,
  getAllLessonsForApproval,
  analyzeLessonPlan
} = require("../controller/lessonController");

const { protect, authorize } = require("../middleware/auth");

// Protect all lesson routes
router.use(protect);

// 🟠 Teacher routes
router.route("/")
  .post(createLesson)
  .get(getAllUserLessonPlans);

router.post("/save", saveLessonPlan);
router.get("/recent", getRecentLessonPlans);
router.get("/by-class/:classId", getLessonPlansByClass);
router.post("/enhance", enhanceLessonSection);
router.post("/analyze", analyzeLessonPlan);
router.put("/:id/send", sendForApproval);

// 🟣 Admin / Head / Principal routes (order important)
router.get(
  "/pending",
  authorize("admin", "super_admin", "english_head", "math_head"),
  getPendingLessons
);

router.patch(
  "/:id/approve",
  authorize("admin", "super_admin", "english_head", "math_head"),
  approveLesson
);

router.patch(
  "/:id/reject",
  authorize("admin", "super_admin", "english_head", "math_head"),
  rejectLesson
);

router.get(
  "/approval/all",
  authorize(
    "math_head",
    "english_head",
    "admin",
    "super_admin"
  ),
  getAllLessonsForApproval
);

// ⚠️ Always keep this last so it doesn't override others
router.route("/:id")
  .get(getLessonPlanById)
  .put(updateLessonPlan)
  .delete(deleteLessonPlan);

module.exports = router;
