const express = require('express');
const router = express.Router();
const {
    createLesson,
    saveLessonPlan,
    getLessonPlanById,
    getAllUserLessonPlans,
    getRecentLessonPlans
} = require('../controller/lessonController');

// Middleware to protect routes (if needed)
const { protect } = require('../middleware/auth');


router.use(protect)
router.route('/')
    .post(createLesson)
    .get(getAllUserLessonPlans);
router.post('/save', saveLessonPlan); // POST /api/lessons/save

router.get('/recent', getRecentLessonPlans);

router.get('/:id', getLessonPlanById); // GET /api/lessons/:id

module.exports = router;