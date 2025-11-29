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
  getAllLessonsForApproval
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
router.put("/:id/send", sendForApproval);

// 🟣 Admin / Head / Principal routes (order important)
router.get(
  "/pending",
  authorize("school_admin", "super_admin", "principal", "english_head"),
  getPendingLessons
);

router.patch(
  "/:id/approve",
  authorize("school_admin", "super_admin", "principal", "english_head"),
  approveLesson
);

router.patch(
  "/:id/reject",
  authorize("school_admin", "super_admin", "principal", "english_head"),
  rejectLesson
);

router.get(
  "/approval/all",
  authorize(
    "math_head",
    "english_head",
    "science_head",
    "principal",
    "school_admin",
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
