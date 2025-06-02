const express = require("express");
const { fullLessonPlanner } = require("../controller/aseessmentController");


const router = express.Router();

router.post("/fullLessonPlanner", fullLessonPlanner);
module.exports = router;
