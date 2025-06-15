const express = require('express');
const {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getClassesByYear,
  getClassesBySubject,
  getRecentClasses,
} = require('../controller/classController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes in this file
router.use(protect);


// --- Specific routes first ---
router.get('/recent', getRecentClasses);          // GET /api/classes/recent
router.get('/year/:year', getClassesByYear);    // GET /api/classes/year/2025
router.get('/subject/:subject', getClassesBySubject); // GET /api/classes/subject/English


// --- Routes for the base path '/' ---
router.route('/')
  .get(getClasses)      // GET /api/classes
  .post(createClass);     // POST /api/classes


// --- Generic wildcard routes last ---
// These will handle any request that didn't match the specific routes above
router.route('/:id')
  .get(getClassById)      // GET /api/classes/some_object_id
  .put(updateClass)       // PUT /api/classes/some_object_id
  .delete(deleteClass);   // DELETE /api/classes/some_object_id


module.exports = router;