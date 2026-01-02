const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// controllers/adminController.js
const User = require("../model/User");
const RegistrationToken = require("../model/RegistrationToken");
const School = require("../model/School"); // Assuming you want to associate token with a school
const Syllabus = require("../model/Syllabus");
const LessonPlan = require("../model/Lesson");
const Class = require("../model/Class");
const Material = require("../model/Material"); // Added Material model import
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