const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// controllers/adminController.js
const User = require("../model/User");
const RegistrationToken = require("../model/RegistrationToken");
const { admin, firebaseApp } = require("../config/firebaseAdmin");
const { sendEmail } = require("../services/emailService");
const School = require("../model/School");
const Syllabus = require("../model/Syllabus");
const LessonPlan = require("../model/Lesson");
const Class = require("../model/Class");
const Material = require("../model/Material");
const AuditLog = require("../model/AuditLog");
const crypto = require("crypto");
const XLSX = require("xlsx");

// Helper to log audit events
const logAuditEvent = async ({ action, performedBy, schoolId, targetUser = null, details = null, ipAddress = null }) => {
  try {
    await AuditLog.create({ action, performedBy, schoolId, targetUser, details, ipAddress });
  } catch (error) {
    console.error("Failed to log audit event:", error.message);
    // Don't throw - audit logging should not break main operations
  }
};

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
    const { subject, grade, syllabusData } = req.body;
    const createdBy = req.user._id;

    if (!syllabusData || !Array.isArray(syllabusData) || syllabusData.length === 0) {
      return res.status(400).json({ success: false, message: "No syllabus data provided" });
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

    // Save as ONE syllabus doc
    const saved = await Syllabus.create({
      schoolId,
      subject,
      grade,
      createdBy,
      syllabus: syllabusData, // Use the JSON data directly
    });

    return res.status(201).json({
      success: true,
      message: "Syllabus uploaded successfully",
      syllabusId: saved._id,
      totalItems: syllabusData.length,
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

// @desc    Get detailed analytics for a specific teacher
// @route   GET /api/admin/teachers/:id/analytics
// @access  Private (school_admin, super_admin, principals)
exports.getTeacherAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterUser = await User.findById(req.user._id);

    // 1. Verify access (must be same school)
    const teacher = await User.findOne({ _id: id, schoolId: requesterUser.schoolId })
      .select("-password -geminiApiKey -__v");

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found in your school" });
    }

    const Material = require("../model/Material"); // Ensure this is imported at the top if not already

    // 2. Fetch Lesson Stats
    // Aggregation for Approval Status (Draft, Pending, Approved, Rejected)
    const statusStats = await LessonPlan.aggregate([
      { $match: { createdBy: teacher._id } },
      { $group: { _id: "$approvalStatus", count: { $sum: 1 } } }
    ]);

    // Format for Chart: Ensure all statuses are present (default 0)
    const defaultStatuses = ["draft", "pending", "approved", "rejected"];
    const statusDistribution = defaultStatuses.map(status => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count: statusStats.find(s => s._id === status)?.count || 0
    }));

    // Aggregation for Subject Distribution
    const subjectStats = await LessonPlan.aggregate([
      { $match: { createdBy: teacher._id } },
      {
        $lookup: {
          from: "classes",
          localField: "classId",
          foreignField: "_id",
          as: "classInfo"
        }
      },
      { $unwind: "$classInfo" },
      { $group: { _id: "$classInfo.subject", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const subjectsTaught = subjectStats.map(s => s._id);

    // --- PROPOSAL IMPLEMENTATION ---

    // 1. Productivity Trend (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); // Go back 5 months + current
    const activityStats = await LessonPlan.aggregate([
      {
        $match: {
          createdBy: teacher._id,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Fill missing months for charts
    const activityOverTime = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const mon = d.toLocaleString('default', { month: 'short' });
      const yr = d.getFullYear();

      const found = activityStats.find(s => s._id.month === d.getMonth() + 1 && s._id.year === yr);
      activityOverTime.push({
        name: `${mon}`,
        fullName: `${mon} ${yr}`,
        lessons: found ? found.count : 0
      });
    }


    // 2. Pedagogical Focus (HOTS)
    const hotsStats = await LessonPlan.aggregate([
      { $match: { createdBy: teacher._id, "parameters.hotsFocus": { $exists: true, $ne: null } } },
      { $group: { _id: "$parameters.hotsFocus", count: { $sum: 1 } } }
    ]);

    const hotsDistribution = hotsStats.map(h => ({
      name: h._id ? (h._id.charAt(0).toUpperCase() + h._id.slice(1)) : "Unspecified",
      value: h.count
    }));


    // 3. Material Utilization
    const materialUploadCount = await Material.countDocuments({ user: teacher._id });

    // Check lessons that used material vs syllabus
    const materialUsageStats = await LessonPlan.aggregate([
      { $match: { createdBy: teacher._id } },
      {
        $project: {
          sourceType: {
            $cond: { if: { $gt: ["$parameters.materialId", null] }, then: "Material", else: "Syllabus" } // Assuming we store materialId in parameters from Step 2
          }
        }
      },
      { $group: { _id: "$sourceType", count: { $sum: 1 } } }
    ]);

    const materialVsSyllabus = {
      materialBased: materialUsageStats.find(s => s._id === "Material")?.count || 0,
      syllabusBased: materialUsageStats.find(s => s._id === "Syllabus")?.count || 0,
      totalUploads: materialUploadCount
    };


    // 4. Recent Activity Log (Combine Lessons & Materials)
    const recentLessons = await LessonPlan.find({ createdBy: teacher._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("parameters.specificTopic createdAt approvedAt")
      .lean();

    const recentMaterials = await Material.find({ user: teacher._id })
      .sort({ uploadDate: -1 }) // Material uses 'uploadDate'
      .limit(5)
      .select("name uploadDate type")
      .lean();

    // Combine and sort
    let recentActivity = [
      ...recentLessons.map(l => ({
        type: "lesson_created",
        title: l.parameters?.specificTopic || "Untitled Lesson",
        date: l.createdAt
      })),
      ...recentMaterials.map(m => ({
        type: "material_upload",
        title: m.name,
        meta: m.type,
        date: m.uploadDate
      }))
    ];

    // Sort combined list by date descending and take top 5
    recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
    recentActivity = recentActivity.slice(0, 5);


    // Total Lessons
    const totalLessons = await LessonPlan.countDocuments({ createdBy: teacher._id });

    // Total Classes (Created by this teacher)
    const totalClasses = await Class.countDocuments({ createdBy: teacher._id });

    // 3. Last Online / Activity (inferred from lastLogin or last lesson creation)
    const lastLesson = await LessonPlan.findOne({ createdBy: teacher._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        teacher: {
          ...teacher.toObject(),
          subjectsTaught // Inferred from lessons
        },
        analytics: {
          totalLessons,
          totalClasses,
          statusDistribution, // For Spider Chart
          subjectDistribution: subjectStats.map(s => ({ subject: s._id, count: s.count })),
          lastActivity: lastLesson ? lastLesson.createdAt : null,

          // New Metrics
          activityOverTime,
          hotsDistribution,
          materialUsage: materialVsSyllabus,
          recentActivity
        }
      }
    });

  } catch (error) {
    console.error("Error fetching teacher analytics:", error);
    res.status(500).json({ success: false, message: "Server error fetching analytics" });
  }
};

// @desc    Extract syllabus structure from uploaded file (PDF/Image) using AI
// @route   POST /api/admin/syllabuses/extract-structure
// @access  Private

// TODO: Change to extract DSKP
// Extract Data from Syllabus document based on Schema

// @desc    Extract syllabus structure from uploaded file (PDF/Image) using Gemini Vision (Direct)
// @route   POST /api/admin/syllabuses/extract-structure
// @access  Private
exports.extractSyllabusData = async (req, res) => {
  try {
    console.log("extractSyllabusData (Gemini Direct) called");
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Parse the schema
    let schemaStr = req.body.schema;
    if (!schemaStr) {
      return res.status(400).json({ success: false, message: "No schema provided" });
    }
    let schema;
    try {
      schema = JSON.parse(schemaStr);
    } catch (e) {
      return res.status(400).json({ success: false, message: "Invalid schema format" });
    }

    console.log("File received:", req.file.originalname, req.file.mimetype, req.file.size);

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, message: "Server misconfiguration: API Key missing" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      Analyze this uploaded syllabus document (PDF/Image).
      
      TASK: Extract the syllabus data into a JSON array, strictly following the provided schema.
      The document contains tables or lists with columns such as "Content Standard", "Learning Standard", "Notes", etc.

      MAPPING SCHEMA (Target Keys):
      ${JSON.stringify(schema, null, 2)}

      RULES:
      1. Return a JSON object with a single key "data".
      2. "data" must be an ARRAY of OBJECTS.
      3. Each object represents ONE ROW of the syllabus content.
      4. Flatten structure: If multiple "Learning Standards" belong to one "Content Standard", repeat the "Content Standard" for each row.
      5. Extract ALL content found in the document. Do not summarize.
      6. Return ONLY valid JSON.
    `;

    const filePart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype
      }
    };

    console.log("Sending file to Gemini...");
    const result = await model.generateContent([prompt, filePart]);
    const response = await result.response;
    let responseText = response.text();

    console.log("Gemini Response received.");

    // Clean JSON
    responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", responseText);
      return res.status(500).json({
        success: false,
        message: "Failed to parse AI response.",
        rawResponse: responseText
      });
    }

    return res.status(200).json({
      success: true,
      data: jsonResponse.data
    });

  } catch (error) {
    console.error("Error extracting syllabus data:", error);
    return res.status(500).json({
      success: false,
      message: "Error extracting syllabus data",
      error: error.message
    });
  }
};

// @desc    Get all active registration tokens for the school
// @route   GET /api/admin/tokens/active
// @access  Private (school_admin, super_admin)
exports.getActiveTokens = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "Admin account is not associated with a school." });
    }

    const tokens = await RegistrationToken.find({
      schoolId: schoolId,
      isActive: true
    })
      .select('token createdAt expiresAt usageCount maxUsage isMultiUse purpose')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tokens
    });
  } catch (error) {
    console.error("Error fetching active tokens:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching active tokens.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Delete a teacher
// @route   DELETE /api/admin/teachers/:id
// @access  Private (school_admin, super_admin)
exports.deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterUser = await User.findById(req.user._id);

    // 1. Verify access (must be same school)
    const teacher = await User.findOne({ _id: id, schoolId: requesterUser.schoolId });

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found in your school" });
    }

    // 2. Delete from Firebase (if applicable)
    if (teacher.firebaseUid && firebaseApp) {
      try {
        await admin.auth().deleteUser(teacher.firebaseUid);
      } catch (firebaseError) {
        console.error(`[DeleteTeacher] Failed to delete from Firebase:`, firebaseError.message);
        // We continue to delete from MongoDB even if Firebase fails, 
        // to avoid "zombie" accounts in our DB.
      }
    } else if (teacher.firebaseUid && !firebaseApp) {
      console.warn(`[DeleteTeacher] Skipping Firebase deletion - Admin SDK not initialized.`);
    }

    // 3. Delete teacher from MongoDB
    const deleteResult = await User.deleteOne({ _id: teacher._id });

    if (deleteResult.deletedCount === 0) {
      return res.status(500).json({ success: false, message: "Failed to delete teacher from database" });
    }

    // Log audit event
    await logAuditEvent({
      action: "DELETE_TEACHER",
      performedBy: req.user._id,
      schoolId: requesterUser.schoolId,
      targetUser: teacher._id,
      details: { teacherName: teacher.name, teacherEmail: teacher.email }
    });

    res.status(200).json({ success: true, message: "Teacher deleted successfully" });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    res.status(500).json({ success: false, message: "Server error deleting teacher" });
  }
};

// @desc    Invite a teacher via email (Magic Link)
// @route   POST /api/admin/invite
// @access  Private (school_admin)
exports.inviteTeacher = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User with this email is already registered." });
    }

    const requesterUser = await User.findById(req.user._id);

    // 2. Generate a single-use token
    const token = crypto.randomBytes(20).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const registrationToken = await RegistrationToken.create({
      token,
      schoolId: requesterUser.schoolId,
      createdBy: req.user._id,
      expiresAt,
      isMultiUse: false,
      maxUsage: 1,
    });

    // 3. Construct Magic Link
    // Use an environment variable for the frontend URL, fallback to localhost
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const inviteLink = `${clientUrl}/register?token=${token}`;

    // 4. Send Email - Modern HTML Template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation to Join Lesson Planner</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 0; overflow: hidden;">
                <!-- Header with Logo -->
                <tr>
                  <td style="background-color: #ffffff; padding: 30px 40px; border-bottom: 1px solid #f1f5f9; text-align: center;">
                     <img src="https://i.imgur.com/rOI9pod.png alt="Lesson Planner Logo" style="height: 60px; display: block; margin: 0 auto;">
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 24px 0; color: #1e293b; font-size: 20px; font-weight: 600;">You've been invited to collaborate</h2>
                    <p style="margin: 0 0 24px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                      Hello,
                    </p>
                    <p style="margin: 0 0 24px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                      <strong>${requesterUser.name}</strong> has invited you to join their organization on <strong>Lesson Planner</strong>. 
                      Accept the invitation to create your account and start accessing shared resources and AI-powered planning tools.
                    </p>
                    
                    <!-- Call to Action -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="left" style="padding: 10px 0 30px 0;">
                          <a href="${inviteLink}" style="display: inline-block; padding: 14px 32px; background-color: #1890ff; color: #ffffff; text-decoration: none; border-radius: 0; font-size: 15px; font-weight: 600; transition: background-color 0.2s;">Accept Invitation</a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.5;">
                      If the button above doesn't work, verify your account by clicking the link below:<br>
                      <a href="${inviteLink}" style="color: #1890ff; text-decoration: none; word-break: break-all;">${inviteLink}</a>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 13px;">
                      This invitation is valid for <strong>24 hours</strong>.
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 13px;">
                      &copy; ${new Date().getFullYear()} AI Lesson Planner. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await sendEmail({
      to: email,
      subject: "Invitation to Join Lesson Planner",
      html: emailHtml,
      fromName: requesterUser.name, // Display admin's name in the email "From" field
    });

    // Log audit event
    await logAuditEvent({
      action: "INVITE_TEACHER",
      performedBy: req.user._id,
      schoolId: requesterUser.schoolId,
      details: { email, token }
    });

    res.status(200).json({
      success: true,
      message: "Invitation sent successfully!",
      token: token, // Return token for debug/manual copy
      link: inviteLink
    });

  } catch (error) {
    console.error("Invite teacher error:", error);
    res.status(500).json({ success: false, message: "Failed to send invitation." });
  }
};

// @desc    Toggle teacher active status (Activate/Deactivate)
// @route   PUT /api/admin/teachers/:id/status
// @access  Private (school_admin, super_admin)
exports.toggleTeacherStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterUser = await User.findById(req.user._id);

    // 1. Find teacher in same school
    const teacher = await User.findOne({ _id: id, schoolId: requesterUser.schoolId });

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found in your school" });
    }

    // 2. Toggle the isActive status
    teacher.isActive = !teacher.isActive;
    await teacher.save();

    const statusText = teacher.isActive ? "activated" : "deactivated";

    res.status(200).json({
      success: true,
      message: `Teacher ${statusText} successfully`,
      isActive: teacher.isActive
    });
  } catch (error) {
    console.error("Error toggling teacher status:", error);
    res.status(500).json({ success: false, message: "Server error toggling teacher status" });
  }
};

// @desc    Revoke/Delete a registration token
// @route   DELETE /api/admin/tokens/:id
// @access  Private (school_admin, super_admin)
exports.revokeToken = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterUser = await User.findById(req.user._id);

    const token = await RegistrationToken.findOne({ _id: id, schoolId: requesterUser.schoolId });

    if (!token) {
      return res.status(404).json({ success: false, message: "Token not found" });
    }

    await RegistrationToken.deleteOne({ _id: id });

    res.status(200).json({ success: true, message: "Token revoked successfully" });
  } catch (error) {
    console.error("Error revoking token:", error);
    res.status(500).json({ success: false, message: "Server error revoking token" });
  }
};

// @desc    Resend invitation email for a token
// @route   POST /api/admin/tokens/:id/resend
// @access  Private (admin, super_admin)
exports.resendInvite = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const requesterUser = await User.findById(req.user._id);
    const tokenDoc = await RegistrationToken.findOne({ _id: id, schoolId: requesterUser.schoolId });

    if (!tokenDoc) {
      return res.status(404).json({ success: false, message: "Token not found" });
    }

    // Check if token is expired
    if (new Date() > tokenDoc.expiresAt) {
      return res.status(400).json({ success: false, message: "Token has expired. Please generate a new invite." });
    }

    // Construct Magic Link
    const clientUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}.vercel.app` : "http://localhost:3000";
    const inviteLink = `${clientUrl}/register?token=${tokenDoc.token}`;

    // Send Email (reuse the template from inviteTeacher)
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reminder: Invitation to Join Lesson Planner</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 0; overflow: hidden;">
                <!-- Header with Logo -->
                <tr>
                  <td style="background-color: #ffffff; padding: 30px 40px; border-bottom: 1px solid #f1f5f9; text-align: center;">
                     <img src="https://i.imgur.com/rOI9pod.png" alt="Lesson Planner Logo" style="height: 60px; display: block; margin: 0 auto;">
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 24px 0; color: #1e293b; font-size: 20px; font-weight: 600;">Reminder: You've been invited</h2>
                    <p style="margin: 0 0 24px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                      Hello,
                    </p>
                    <p style="margin: 0 0 24px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                      This is a reminder that <strong>${requesterUser.name}</strong> has invited you to join <strong>Lesson Planner</strong>.
                      We noticed you haven't accepted the invitation yet.
                    </p>
                    
                    <!-- Call to Action -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="left" style="padding: 10px 0 30px 0;">
                          <a href="${inviteLink}" style="display: inline-block; padding: 14px 32px; background-color: #1890ff; color: #ffffff; text-decoration: none; border-radius: 0; font-size: 15px; font-weight: 600; transition: background-color 0.2s;">Accept Invitation</a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.5;">
                      If the button above doesn't work, click the link below to get started:<br>
                      <a href="${inviteLink}" style="color: #1890ff; text-decoration: none; word-break: break-all;">${inviteLink}</a>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 13px;">
                      This link expires soon.
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 13px;">
                      &copy; ${new Date().getFullYear()} AI Lesson Planner. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await sendEmail({
      to: email,
      subject: "Reminder: Invitation to Join Lesson Planner",
      html: emailHtml,
      fromName: requesterUser.name,
    });

    res.status(200).json({ success: true, message: "Invitation resent successfully!" });
  } catch (error) {
    console.error("Error resending invite:", error);
    res.status(500).json({ success: false, message: "Server error resending invite" });
  }
};

// @desc    Update teacher's role
// @route   PUT /api/admin/teachers/:id/role
// @access  Private (school_admin, super_admin)
exports.updateTeacherRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { roles } = req.body; // Expecting an array of roles

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ success: false, message: "Roles must be a non-empty array" });
    }

    // Validate roles
    const validRoles = ['teacher', 'admin', 'math_head', 'science_head', 'english_head', 'history_head', 'geography_head'];
    const invalidRoles = roles.filter(r => !validRoles.includes(r));
    if (invalidRoles.length > 0) {
      return res.status(400).json({ success: false, message: `Invalid roles: ${invalidRoles.join(', ')}` });
    }

    const requesterUser = await User.findById(req.user._id);
    const teacher = await User.findOne({ _id: id, schoolId: requesterUser.schoolId });

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found in your school" });
    }

    teacher.roles = roles;
    await teacher.save();

    res.status(200).json({
      success: true,
      message: "Teacher roles updated successfully",
      roles: teacher.roles
    });
  } catch (error) {
    console.error("Error updating teacher role:", error);
    res.status(500).json({ success: false, message: "Server error updating teacher role" });
  }
};

// @desc    Get audit logs for the school
// @route   GET /api/admin/audit-logs
// @access  Private (school_admin, super_admin)
exports.getAuditLogs = async (req, res) => {
  try {
    const requesterUser = await User.findById(req.user._id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find({ schoolId: requesterUser.schoolId })
        .populate("performedBy", "name email")
        .populate("targetUser", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments({ schoolId: requesterUser.schoolId })
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ success: false, message: "Server error fetching audit logs" });
  }
};