// controllers/adminController.js
const User = require("../model/User");
const RegistrationToken = require("../model/RegistrationToken");
const School = require("../model/School"); // Assuming you want to associate token with a school
const Syllabus = require("../model/Syllabus");
const crypto = require("crypto");
const XLSX = require("xlsx");

// Helper to generate a secure random token string
const generateSecureToken = () => {
  return crypto.randomBytes(24).toString("hex"); // 48 character hex string
};

// @desc    Generate a new teacher registration token
// @route   POST /api/admin/generate-teacher-token
// @access  Private (school_admin, super_admin)
exports.generateTeacherRegistrationToken = async (req, res) => {
  try {
    const { isMultiUse = false, maxUsage, expiryInDays = 7, purpose = "teacher_registration" } = req.body;

    const schoolId = req.user.schoolId;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "Admin account is not associated with a school." });
    }

    if (isMultiUse && maxUsage !== undefined && (typeof maxUsage !== 'number' || maxUsage < 1)) {
      return res.status(400).json({ success: false, message: "maxUsage must be a positive number if isMultiUse is true." });
    }

    if (expiryInDays !== undefined && (typeof expiryInDays !== 'number' || expiryInDays < 1)) {
      return res.status(400).json({ success: false, message: "expiryInDays must be a positive number." });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryInDays);

    const newToken = generateSecureToken();

    const registrationToken = await RegistrationToken.create({
      token: newToken,
      schoolId: schoolId,
      createdBy: req.user.id,
      purpose,
      isMultiUse,
      maxUsage: isMultiUse ? maxUsage : undefined,
      expiresAt,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Registration token generated successfully.",
      token: registrationToken.token,
    });
  } catch (error) {
    console.error("Error generating teacher registration token:", error);
    res.status(500).json({
      success: false,
      message: "Server error generating token.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


// GET all teachers for a specific school
exports.getTeachersBySchool = async (req, res) => {
  try {
    const schoolId = req.user.schoolId.toString();

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "schoolId is required" });
    }

    const teachers = await User.find({
      schoolId,
      // role: "teacher"
    })
      .select("name email roles createdAt updatedAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      teachers,
    });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({ success: false, message: "Server error fetching teachers" });
  }
};

exports.uploadSyllabus = async (req, res) => {
  try {
    const { subject, grade } = req.body;
    const createdBy = req.user._id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No Excel file uploaded" });
    }

    if (!subject || !grade) {
      return res.status(400).json({ success: false, message: "Subject and grade are required" });
    }

    // Fetch school from logged-in user
    const user = await User.findById(createdBy);
    const schoolId = user.schoolId;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "User not assigned to a school" });
    }

    // Read Excel -> JSON rows
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    // Convert flat Excel keys into nested JSON objects dynamically
    const syllabusArray = rows.map((row) => {
      const obj = {};

      Object.keys(row).forEach((key) => {
        const value = row[key];

        if (key.includes(".")) {
          const parts = key.split(".");
          let pointer = obj;

          parts.forEach((p, index) => {
            if (index === parts.length - 1) {
              pointer[p] = value;
            } else {
              if (!pointer[p]) pointer[p] = {};
              pointer = pointer[p];
            }
          });
        } else {
          obj[key] = value;
        }
      });

      return obj;
    });

    // Save as ONE syllabus doc
    const saved = await Syllabus.create({
      schoolId,
      subject,
      grade,
      createdBy,
      syllabus: syllabusArray,
    });

    return res.status(201).json({
      success: true,
      message: "Syllabus uploaded successfully",
      syllabusId: saved._id,
      totalItems: syllabusArray.length,
    });

  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Error uploading syllabus",
      error: error.message
    });
  }
};

// Add these functions to your existing adminController.js

// @desc    Get all syllabuses for the school
// @route   GET /api/admin/syllabuses
// @access  Private (school_admin, super_admin, etc.)
exports.getSyllabuses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const schoolId = user.schoolId;

    if (!schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: "User not assigned to a school" 
      });
    }

    // Fetch all syllabuses for this school
    const syllabuses = await Syllabus.find({ schoolId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Transform the data to match frontend expectations
    const transformedSyllabuses = syllabuses.map(syl => ({
      id: syl._id.toString(),
      grade: syl.grade,
      subject: syl.subject,
      data: syl.syllabus, // Array of syllabus items
      createdBy: syl.createdBy?.name || 'Admin',
      date: syl.createdAt ? new Date(syl.createdAt).toISOString().split('T')[0] : 'N/A',
      createdAt: syl.createdAt,
      updatedAt: syl.updatedAt
    }));

    return res.status(200).json({
      success: true,
      data: transformedSyllabuses,
      count: transformedSyllabuses.length
    });

  } catch (error) {
    console.error("Error fetching syllabuses:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching syllabuses",
      error: error.message
    });
  }
};

// @desc    Get a single syllabus by ID
// @route   GET /api/admin/syllabuses/:id
// @access  Private (school_admin, super_admin, etc.)
exports.getSyllabusById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    const schoolId = user.schoolId;

    if (!schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: "User not assigned to a school" 
      });
    }

    const syllabus = await Syllabus.findOne({ 
      _id: id, 
      schoolId 
    })
      .populate('createdBy', 'name email')
      .lean();

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: "Syllabus not found"
      });
    }

    // Transform the data
    const transformedSyllabus = {
      id: syllabus._id.toString(),
      grade: syllabus.grade,
      subject: syllabus.subject,
      data: syllabus.syllabus,
      createdBy: syllabus.createdBy?.name || 'Admin',
      date: syllabus.createdAt ? new Date(syllabus.createdAt).toISOString().split('T')[0] : 'N/A',
      createdAt: syllabus.createdAt,
      updatedAt: syllabus.updatedAt
    };

    return res.status(200).json({
      success: true,
      data: transformedSyllabus
    });

  } catch (error) {
    console.error("Error fetching syllabus:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching syllabus",
      error: error.message
    });
  }
};

// @desc    Delete a syllabus
// @route   DELETE /api/admin/syllabuses/:id
// @access  Private (school_admin, super_admin, etc.)
exports.deleteSyllabus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    const schoolId = user.schoolId;

    if (!schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: "User not assigned to a school" 
      });
    }

    // Find and delete the syllabus, ensuring it belongs to the user's school
    const syllabus = await Syllabus.findOneAndDelete({ 
      _id: id, 
      schoolId 
    });

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: "Syllabus not found or you don't have permission to delete it"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Syllabus deleted successfully",
      deletedId: id
    });

  } catch (error) {
    console.error("Error deleting syllabus:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting syllabus",
      error: error.message
    });
  }
};

// @desc    Update a syllabus
// @route   PUT /api/admin/syllabuses/:id
// @access  Private (school_admin, super_admin, etc.)
exports.updateSyllabus = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, grade } = req.body;
    const user = await User.findById(req.user._id);
    const schoolId = user.schoolId;

    if (!schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: "User not assigned to a school" 
      });
    }

    // Find the existing syllabus
    const existingSyllabus = await Syllabus.findOne({ 
      _id: id, 
      schoolId 
    });

    if (!existingSyllabus) {
      return res.status(404).json({
        success: false,
        message: "Syllabus not found or you don't have permission to update it"
      });
    }

    // Update fields
    if (subject) existingSyllabus.subject = subject;
    if (grade) existingSyllabus.grade = grade;

    // If a new file is uploaded, parse it
    if (req.file) {
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      // Convert flat Excel keys into nested JSON objects dynamically
      const syllabusArray = rows.map((row) => {
        const obj = {};

        Object.keys(row).forEach((key) => {
          const value = row[key];

          if (key.includes(".")) {
            const parts = key.split(".");
            let pointer = obj;

            parts.forEach((p, index) => {
              if (index === parts.length - 1) {
                pointer[p] = value;
              } else {
                if (!pointer[p]) pointer[p] = {};
                pointer = pointer[p];
              }
            });
          } else {
            obj[key] = value;
          }
        });

        return obj;
      });

      existingSyllabus.syllabus = syllabusArray;
    }

    await existingSyllabus.save();

    // Transform the data for response
    const transformedSyllabus = {
      id: existingSyllabus._id.toString(),
      grade: existingSyllabus.grade,
      subject: existingSyllabus.subject,
      data: existingSyllabus.syllabus,
      createdBy: user.name || 'Admin',
      date: existingSyllabus.createdAt ? new Date(existingSyllabus.createdAt).toISOString().split('T')[0] : 'N/A',
      createdAt: existingSyllabus.createdAt,
      updatedAt: existingSyllabus.updatedAt
    };

    return res.status(200).json({
      success: true,
      message: "Syllabus updated successfully",
      data: transformedSyllabus
    });

  } catch (error) {
    console.error("Error updating syllabus:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating syllabus",
      error: error.message
    });
  }
};