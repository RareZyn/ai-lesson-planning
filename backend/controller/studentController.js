// backend/controller/studentController.js
const Student = require("../model/Student");
const Class = require("../model/Class");

/**
 * Generate unique student ID
 * Format: STU-YYYY-XXXX (e.g., STU-2025-0001)
 */
const generateStudentId = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `STU-${currentYear}-`;

  // Find the last student ID for this year
  const lastStudent = await Student.findOne({
    studentId: new RegExp(`^${prefix}`),
  })
    .sort({ studentId: -1 })
    .limit(1);

  let nextNumber = 1;
  if (lastStudent) {
    const lastNumber = parseInt(lastStudent.studentId.split("-")[2]);
    nextNumber = lastNumber + 1;
  }

  // Pad with zeros to make it 4 digits
  const paddedNumber = String(nextNumber).padStart(4, "0");
  return `${prefix}${paddedNumber}`;
};

/**
 * @desc    Add a new student to a class
 * @route   POST /api/students
 * @access  Private
 */
exports.addStudent = async (req, res) => {
  try {
    const { name, classId, rollNumber, dateOfBirth, parentContact, notes } =
      req.body;

    // Validate required fields (only name and classId now)
    if (!name || !classId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name and classId",
      });
    }

    // Check if class exists and user owns it
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    if (classDoc.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add students to this class",
      });
    }

    // Auto-generate student ID
    const studentId = await generateStudentId();

    // Create student
    const student = await Student.create({
      name,
      studentId,
      classId,
      grade: classDoc.grade, // Get grade from class
      rollNumber: rollNumber || undefined,
      dateOfBirth: dateOfBirth || undefined,
      parentContact: parentContact || undefined,
      notes: notes || "",
      addedBy: req.user.id,
    });

    // Add student to class
    await classDoc.addStudent(student._id);

    // Populate and return
    await student.populate("classId", "className grade subject");

    res.status(201).json({
      success: true,
      message: "Student added successfully",
      data: student,
    });
  } catch (error) {
    console.error("Add student error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding student",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get all students in a class
 * @route   GET /api/students/:classId
 * @access  Private
 */
exports.getStudentsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const {
      status = "active",
      search,
      sortBy = "name",
      sortOrder = "asc",
    } = req.query;

    // Check if class exists and user owns it
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    if (classDoc.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view students in this class",
      });
    }

    // Build query
    const query = { classId, status };

    // Add search if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const students = await Student.find(query)
      .populate("classId", "className grade subject")
      .sort(sort);

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching students",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get single student by ID
 * @route   GET /api/students/detail/:id
 * @access  Private
 */
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate("classId", "className grade subject year")
      .populate("addedBy", "name email");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check authorization
    const classDoc = await Class.findById(student.classId);
    if (classDoc.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this student",
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Get student error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching student",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Update student information
 * @route   PUT /api/students/detail/:id
 * @access  Private
 */
exports.updateStudent = async (req, res) => {
  try {
    let student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check authorization
    const classDoc = await Class.findById(student.classId);
    if (classDoc.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this student",
      });
    }

    // Update allowed fields (excluding studentId - it's auto-generated)
    const allowedUpdates = [
      "name",
      "rollNumber",
      "dateOfBirth",
      "parentContact",
      "avatar",
      "notes",
      "status",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        student[field] = req.body[field];
      }
    });

    await student.save();

    await student.populate("classId", "className grade subject");

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: student,
    });
  } catch (error) {
    console.error("Update student error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating student",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Delete student
 * @route   DELETE /api/students/detail/:id
 * @access  Private
 */
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check authorization
    const classDoc = await Class.findById(student.classId);
    if (classDoc.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this student",
      });
    }

    // Remove student from class
    await classDoc.removeStudent(student._id);

    // Delete student
    await student.deleteOne();

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
      data: {},
    });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting student",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Search students across all classes
 * @route   GET /api/students/search
 * @access  Private
 */
exports.searchStudents = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters",
      });
    }

    // Get user's classes
    const userClasses = await Class.find({ createdBy: req.user.id }).select(
      "_id"
    );
    const classIds = userClasses.map((c) => c._id);

    const students = await Student.find({
      classId: { $in: classIds },
      $or: [
        { name: { $regex: query, $options: "i" } },
        { studentId: { $regex: query, $options: "i" } },
      ],
    })
      .populate("classId", "className grade subject")
      .sort({ name: 1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error("Search students error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching students",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Bulk import students to a class
 * @route   POST /api/students/bulk-import
 * @access  Private
 */
exports.bulkImportStudents = async (req, res) => {
  try {
    const { classId, students } = req.body;

    if (
      !classId ||
      !students ||
      !Array.isArray(students) ||
      students.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Class ID and students array are required",
      });
    }

    // Check if class exists and user owns it
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    if (classDoc.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add students to this class",
      });
    }

    const results = {
      successful: [],
      failed: [],
    };

    // Process each student
    for (const studentData of students) {
      try {
        // Validate required fields (only name)
        if (!studentData.name) {
          results.failed.push({
            data: studentData,
            reason: "Missing required field: name",
          });
          continue;
        }

        // Auto-generate student ID
        const studentId = await generateStudentId();

        // Create student
        const student = await Student.create({
          name: studentData.name,
          studentId,
          classId,
          grade: classDoc.grade,
          rollNumber: studentData.rollNumber || undefined,
          dateOfBirth: studentData.dateOfBirth || undefined,
          parentContact: studentData.parentContact || undefined,
          notes: studentData.notes || "",
          addedBy: req.user.id,
        });

        // Add to class
        await classDoc.addStudent(student._id);

        results.successful.push(student);
      } catch (err) {
        results.failed.push({
          data: studentData,
          reason: err.message,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Imported ${results.successful.length} of ${students.length} students`,
      data: results,
    });
  } catch (error) {
    console.error("Bulk import error:", error);
    res.status(500).json({
      success: false,
      message: "Error importing students",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Update student performance stats
 * @route   PUT /api/students/:id/performance
 * @access  Private
 */
exports.updatePerformanceStats = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    await student.updatePerformanceStats();

    res.status(200).json({
      success: true,
      message: "Performance stats updated successfully",
      data: student.performanceStats,
    });
  } catch (error) {
    console.error("Update performance stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating performance stats",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
