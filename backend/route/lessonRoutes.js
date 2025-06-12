const express = require('express');
const router = express.Router();
const { createLesson } = require('../controller/lessonController');

// Middleware to protect routes (if needed)
const { protect } = require('../middleware/auth');


router.use(protect)
router.post('/', createLesson);

module.exports = router;