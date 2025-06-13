const express = require('express');
const router = express.Router();
const {
    createLesson,
    saveLessonPlan,
    getLessonPlanById,
    getAllUserLessonPlans,
    getRecentLessonPlans,
    deleteLessonPlan,
    getLessonPlansByClass
} = require('../controller/lessonController');

// Middleware to protect routes (if needed)
const { protect } = require('../middleware/auth');


router.use(protect)
router.route('/')
    .post(createLesson)
    .get(getAllUserLessonPlans);
    
router.post('/save', saveLessonPlan); // POST /api/lessons/save

router.get('/recent', getRecentLessonPlans);

router.route('/:id')
    .get(getLessonPlanById)
    .delete(deleteLessonPlan); // GET /api/lessons/:id

router.get('/by-class/:classId', getLessonPlansByClass);

module.exports = router;