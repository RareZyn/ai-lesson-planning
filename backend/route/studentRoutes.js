// backend/route/studentRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  addStudent,
  getStudentsByClass,
  getStudentById,
  updateStudent,
  deleteStudent,
  searchStudents,
  bulkImportStudents,
  updatePerformanceStats,
  bulkAddStudents
} = require("../controller/studentController");

// Apply authentication to all routes
router.use(protect);

// IMPORTANT: Specific routes MUST come before parameterized routes
// Otherwise /:classId will match everything

// Search route - must be before /:classId
router.get("/search", searchStudents); // GET /api/students/search?query=John

// Bulk import route - must be before /:classId
router.post("/bulk-import", bulkImportStudents); // POST /api/students/bulk-import

// Detail routes - must be before /:classId
router
  .route("/detail/:id")
  .get(getStudentById) // GET /api/students/detail/:id
  .put(updateStudent) // PUT /api/students/detail/:id
  .delete(deleteStudent); // DELETE /api/students/detail/:id

// Performance stats - must be before /:classId
router.put("/:id/performance", updatePerformanceStats); // PUT /api/students/:id/performance

// Add student (no classId in URL)
router.post("/", addStudent); // POST /api/students

// Class-specific routes - LAST because /:classId matches everything
router.get("/:classId", getStudentsByClass); // GET /api/students/:classId

// NEW: Bulk add students to a class
router.post('/:classId/students/bulk', bulkAddStudents);

module.exports = router;
