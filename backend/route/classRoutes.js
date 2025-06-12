const express = require('express');
const router = express.Router();
const {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getClassesByYear,
  getClassesBySubject
} = require('../controller/classController');

// Middleware to protect routes (if needed)
const { protect } = require('../middleware/auth');


// @desc    Get all classes with filtering
// @route   GET /api/classes
router.get('/',protect, getClasses);

// @desc    Get single class by ID
// @route   GET /api/classes/:id
router.get('/:id', getClassById);

// @desc    Create new class
// @route   POST /api/classes
router.post('/', protect, createClass);

// @desc    Update class
// @route   PUT /api/classes/:id
router.put('/:id', updateClass);

// @desc    Delete class
// @route   DELETE /api/classes/:id
router.delete('/:id', deleteClass);

// @desc    Get classes by year
// @route   GET /api/classes/year/:year
router.get('/year/:year', getClassesByYear);

// @desc    Get classes by subject
// @route   GET /api/classes/subject/:subject
router.get('/subject/:subject', getClassesBySubject);



module.exports = router;