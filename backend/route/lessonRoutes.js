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

const { protect, checkPermission } = require("../middleware/auth");
const { PERMISSIONS } = require("../config/permissions");

// Protect all lesson routes
router.use(protect);

// 🟠 Teacher routes
router.route("/")
  .post(checkPermission(PERMISSIONS.LESSON_CREATE), createLesson)
  .get(checkPermission(PERMISSIONS.LESSON_READ), getAllUserLessonPlans);

router.post("/save", checkPermission(PERMISSIONS.LESSON_CREATE), saveLessonPlan);
router.get("/recent", checkPermission(PERMISSIONS.LESSON_READ), getRecentLessonPlans);
router.get("/by-class/:classId", checkPermission(PERMISSIONS.LESSON_READ), getLessonPlansByClass);
router.post("/enhance", checkPermission(PERMISSIONS.LESSON_CREATE), enhanceLessonSection);
router.post("/analyze", checkPermission(PERMISSIONS.LESSON_CREATE), analyzeLessonPlan);
router.put("/:id/send", checkPermission(PERMISSIONS.LESSON_UPDATE), sendForApproval);

// 🟣 Admin / Head / Principal routes (order important)
router.get(
  "/pending",
  checkPermission(PERMISSIONS.LESSON_APPROVE),
  getPendingLessons
);

router.patch(
  "/:id/approve",
  checkPermission(PERMISSIONS.LESSON_APPROVE),
  approveLesson
);

router.patch(
  "/:id/reject",
  checkPermission(PERMISSIONS.LESSON_APPROVE),
  rejectLesson
);

router.get(
  "/approval/all",
  checkPermission(PERMISSIONS.LESSON_APPROVE),
  getAllLessonsForApproval
);

// ⚠️ Always keep this last so it doesn't override others
router.route("/:id")
  .get(checkPermission(PERMISSIONS.LESSON_READ), getLessonPlanById)
  .put(checkPermission(PERMISSIONS.LESSON_UPDATE), updateLessonPlan)
  .delete(checkPermission(PERMISSIONS.LESSON_DELETE), deleteLessonPlan);

module.exports = router;
