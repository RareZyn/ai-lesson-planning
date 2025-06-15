const express = require("express");
const {
  fullLessonPlanner,
  generateActivityAndRubric,
} = require("../controller/aseessmentController");

const router = express.Router();

router.post("/fullLessonPlanner", fullLessonPlanner);
router.post("/generateActivityAndRubric", generateActivityAndRubric);
module.exports = router;
