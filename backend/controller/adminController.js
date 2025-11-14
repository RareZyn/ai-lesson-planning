// controllers/adminController.js
const User = require("../model/User");
const RegistrationToken = require("../model/RegistrationToken");
const School = require("../model/School"); // Assuming you want to associate token with a school
const crypto = require("crypto");

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
    const schoolId  = req.user.schoolId.toString();

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