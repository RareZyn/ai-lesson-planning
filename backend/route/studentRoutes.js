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
} = require("../controller/studentController");

// Apply authentication to all routes
router.use(protect);

// Student CRUD routes
router.post("/", addStudent); // POST /api/students
router.get("/search", searchStudents); // GET /api/students/search?query=John
router.post("/bulk-import", bulkImportStudents); // POST /api/students/bulk-import

// Class-specific routes
router.get("/:classId", getStudentsByClass); // GET /api/students/:classId

// Individual student routes
router
  .route("/detail/:id")
  .get(getStudentById) // GET /api/students/detail/:id
  .put(updateStudent) // PUT /api/students/detail/:id
  .delete(deleteStudent); // DELETE /api/students/detail/:id

// Performance stats
router.put("/:id/performance", updatePerformanceStats); // PUT /api/students/:id/performance

module.exports = router;
