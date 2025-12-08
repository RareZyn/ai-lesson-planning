// controllers/authController.js
const User = require("../model/User");
const RegistrationToken = require("../model/RegistrationToken"); // Import RegistrationToken model
const School = require("../model/School"); // Import School model
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose"); // Import mongoose for ObjectId


// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res, message = "Success") => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  // Prepare user object to send, ensuring sensitive data is not included
  const userResponse = user.toJSON();
  // If user.getGeminiApiKey is a method, call it to check status without exposing key
  userResponse.hasGeminiApiKey = user.geminiApiKey ? true : false;
  // Ensure role and schoolId are always included for frontend logic
  userResponse.role = user.role;
  userResponse.schoolId = user.schoolId;


  res.status(statusCode).cookie("token", token, cookieOptions).json({
    success: true,
    message,
    token,
    user: userResponse, // Send the cleaned user object
  });
};

// @desc    Register a new teacher using a registration token
// @route   POST /api/auth/register-teacher
// @access  Public
exports.registerTeacherWithToken = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { name, email, password, registrationToken, firebaseUid, geminiApiKey } = req.body;

    // 1. Validate the registration token
    if (!registrationToken) {
      return res.status(400).json({ success: false, message: "Registration token is required." });
    }

    const foundToken = await RegistrationToken.findOne({ token: registrationToken, isActive: true });

    if (!foundToken) {
      return res.status(400).json({ success: false, message: "Invalid or expired registration token." });
    }

    if (foundToken.expiresAt < new Date()) {
      foundToken.isActive = false; // Mark token as inactive if expired
      await foundToken.save();
      return res.status(400).json({ success: false, message: "Registration token has expired." });
    }

    if (!foundToken.isMultiUse && foundToken.usageCount >= 1) {
      return res.status(400).json({ success: false, message: "This is a single-use token and has already been used." });
    }

    if (foundToken.isMultiUse && foundToken.maxUsage && foundToken.usageCount >= foundToken.maxUsage) {
      foundToken.isActive = false; // Mark token as inactive if max usage reached
      await foundToken.save();
      return res.status(400).json({ success: false, message: "This multi-use token has reached its maximum usage." });
    }

    // 2. Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email.",
      });
    }

    // 3. Create user with 'teacher' role and schoolId from token
    const user = await User.create({
      name,
      email,
      password,
      schoolId: foundToken.schoolId, // Assign schoolId from the token
      role: "teacher", // Default role for token-based registration
      firebaseUid,
      geminiApiKey: geminiApiKey || "",
    });

    // 4. Update token usage
    foundToken.usageCount += 1;
    if (!foundToken.isMultiUse || (foundToken.maxUsage && foundToken.usageCount >= foundToken.maxUsage)) {
      foundToken.isActive = false;
    }
    await foundToken.save();

    sendTokenResponse(user, 201, res, "Teacher registration successful.");
  } catch (error) {
    console.error("Teacher registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during teacher registration.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


// @desc    Login user (unchanged, as it uses email/password for all roles)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    const user = await User.findByEmail(email).select("+password").populate('schoolId'); // Populate school for response
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: "Account has been deactivated" });
    }

    if (!user.password) {
      return res.status(401).json({ success: false, message: "Please use Google sign-in for this account" });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    user.lastLogin = new Date();
    await user.save();

    sendTokenResponse(user, 200, res, "Login successful");
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


// @desc    Google OAuth login/register for new teachers with token
// @route   POST /api/auth/google-register-teacher
// @access  Public
exports.googleAuthWithToken = async (req, res) => {
  try {
    const { googleId, email, name, avatar, registrationToken, geminiApiKey } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({ success: false, message: "Google ID and email are required." });
    }
    if (!registrationToken) {
      return res.status(400).json({ success: false, message: "Registration token is required." });
    }

    // 1. Validate the registration token
    const foundToken = await RegistrationToken.findOne({ token: registrationToken, isActive: true });

    if (!foundToken) {
      return res.status(400).json({ success: false, message: "Invalid or expired registration token." });
    }
    if (foundToken.expiresAt < new Date()) {
      foundToken.isActive = false;
      await foundToken.save();
      return res.status(400).json({ success: false, message: "Registration token has expired." });
    }
    if (!foundToken.isMultiUse && foundToken.usageCount >= 1) {
      return res.status(400).json({ success: false, message: "This is a single-use token and has already been used." });
    }
    if (foundToken.isMultiUse && foundToken.maxUsage && foundToken.usageCount >= foundToken.maxUsage) {
      foundToken.isActive = false;
      await foundToken.save();
      return res.status(400).json({ success: false, message: "This multi-use token has reached its maximum usage." });
    }

    let user = await User.findByGoogleId(googleId);

    if (user) {
      // User already exists via Google, but might not have schoolId or token processed
      if (!user.schoolId) {
        // If an existing Google user somehow doesn't have a schoolId, update it
        user.schoolId = foundToken.schoolId;
        user.role = "teacher"; // Ensure role is teacher for token-based Google registration
        user.lastLogin = new Date();
        if (geminiApiKey) user.geminiApiKey = geminiApiKey;
        await user.save();
        // Update token usage
        foundToken.usageCount += 1;
        if (!foundToken.isMultiUse || (foundToken.maxUsage && foundToken.usageCount >= foundToken.maxUsage)) {
          foundToken.isActive = false;
        }
        await foundToken.save();
        return sendTokenResponse(user, 200, res, "Google user profile completed.");
      } else {
        // Existing Google user with schoolId, just update last login/API key
        user.lastLogin = new Date();
        if (geminiApiKey) user.geminiApiKey = geminiApiKey;
        await user.save();
        return sendTokenResponse(user, 200, res, "Google authentication successful.");
      }
    } else {
      // New Google user, create new entry
      user = await User.findByEmail(email); // Check if email exists without Google ID

      if (user) {
        // Existing user with email, link Google account and add schoolId
        if (user.schoolId) {
          // If user already has a schoolId, maybe it's an existing admin trying to use Google?
          // For now, disallow. Or handle based on specific rules.
          // For token-based teacher registration, this shouldn't happen often.
          return res.status(400).json({ success: false, message: "An account with this email already exists and is associated with a school. Please contact your admin if you believe this is an error." });
        }
        user.googleId = googleId;
        user.schoolId = foundToken.schoolId;
        user.role = "teacher";
        if (avatar) user.avatar = avatar;
        if (geminiApiKey) user.geminiApiKey = geminiApiKey;
        user.lastLogin = new Date();
        await user.save();
      } else {
        // Truly a new user
        user = await User.create({
          name: name || email.split("@")[0],
          email,
          schoolId: foundToken.schoolId,
          role: "teacher", // Set role as teacher
          googleId,
          avatar: avatar || "",
          geminiApiKey: geminiApiKey || "",
          isEmailVerified: true,
        });
      }
    }

    // 4. Update token usage
    foundToken.usageCount += 1;
    if (!foundToken.isMultiUse || (foundToken.maxUsage && foundToken.usageCount >= foundToken.maxUsage)) {
      foundToken.isActive = false;
    }
    await foundToken.save();

    sendTokenResponse(user, 200, res, "Google teacher registration successful.");
  } catch (error) {
    console.error("Google auth with token error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during Google authentication.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // Populate schoolId to include school details in the response
    const user = await User.findById(req.user.id)
      .select("+geminiApiKey")
      .populate("schoolId"); // Populate the schoolId field

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Include decrypted API key status (not the actual key)
    const userResponse = user.toJSON(); // Already handles removing password/encrypted API key
    userResponse.hasGeminiApiKey = !!user.geminiApiKey; // Check if key exists (encrypted or not)

    // Ensure role and schoolId are part of the direct response
    userResponse.role = user.role;
    userResponse.schoolId = user.schoolId; // This will now be the populated school object or null

    res.status(200).json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    // Note: schoolId cannot be updated via this route for security reasons.
    // Role also cannot be updated here.
    const { name, geminiApiKey } = req.body; // Removed schoolName from here

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name) user.name = name;
    if (geminiApiKey !== undefined) user.geminiApiKey = geminiApiKey;

    await user.save();

    // Re-fetch user with populated schoolId for a consistent response
    const updatedUser = await User.findById(req.user.id).populate('schoolId');

    sendTokenResponse(updatedUser, 200, res, "Profile updated successfully");
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during profile update",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


// @desc    Logout user / clear cookie (unchanged)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};


// @desc    Change password or set initial password for Google-authenticated users
// @route   PUT /api/auth/password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ success: false, message: "New password is required" });
    }

    const user = await User.findById(req.user.id).select("+password");

    // If user has no password (Google-authenticated), allow setting initial password
    if (!user.password) {
      // No current password required for Google users setting their first password
      user.password = newPassword;
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Password set successfully. You can now login with email and password.",
      });
    }

    // If user has a password, require current password for security
    if (!currentPassword) {
      return res.status(400).json({ success: false, message: "Current password is required" });
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password change",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


// @desc    Get Gemini API key (unchanged, but User.getGeminiApiKey needs to be accurate)
// @route   GET /api/auth/gemini-key
// @access  Private
exports.getGeminiApiKey = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("+geminiApiKey");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Access the raw encrypted key directly from the document for the check
    const hasApiKey = !!user.geminiApiKey;

    // Call the instance method to decrypt if it exists
    const apiKey = hasApiKey ? user.getGeminiApiKey() : "";


    res.status(200).json({
      success: true,
      hasApiKey: hasApiKey,
      apiKey: apiKey || "",
    });
  } catch (error) {
    console.error("Get API key error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting API key",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


// @desc    Update Gemini API key (unchanged)
// @route   PUT /api/auth/gemini-key
// @access  Private
exports.updateGeminiApiKey = async (req, res) => {
  try {
    const { apiKey } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.geminiApiKey = apiKey || "";
    await user.save();

    res.status(200).json({
      success: true,
      message: "API key updated successfully",
      hasApiKey: !!apiKey,
    });
  } catch (error) {
    console.error("Update API key error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating API key",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


/**
 * @desc    Find or create MongoDB user from Firebase user data
 *          This function's primary role is to sync Firebase users with MongoDB
 *          and return enough information for the frontend to decide if
 *          further registration (with a token) is needed.
 * @route   POST /api/auth/firebase-user
 * @access  Public
 */
exports.findOrCreateFirebaseUser = async (req, res) => {
  try {
    console.log("Firebase user sync request received:", req.body);

    const { firebaseUid, email, name, displayName, photoURL, geminiApiKey } = req.body;

    if (!firebaseUid || !email) {
      return res.status(400).json({
        success: false,
        message: "Firebase UID and email are required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format." });
    }

    let user = await User.findOne({ firebaseUid }).populate('schoolId'); // Populate schoolId for the existing user check

    if (!user) {
      user = await User.findOne({ email: email.toLowerCase() }).populate('schoolId');

      if (user) {
        // Existing user by email, link Firebase UID
        user.firebaseUid = firebaseUid;
        user.lastLogin = new Date();
        if (photoURL) user.avatar = photoURL;
        if (displayName && !user.name) user.name = displayName;
        if (geminiApiKey) user.geminiApiKey = geminiApiKey;
        await user.save();
        console.log("Updated existing user with Firebase UID and last login.");
      } else {
        // Truly a new user from Firebase.
        // Create user but *without* schoolId and with a default 'teacher' role.
        // The frontend will then prompt for the token.
        const userName = name || displayName || email.split("@")[0] || "User";

        user = await User.create({
          firebaseUid,
          email: email.toLowerCase(),
          name: userName,
          role: "teacher", // Default to teacher, but without schoolId initially
          isEmailVerified: true,
          lastLogin: new Date(),
          avatar: photoURL || "",
          // schoolId will be null initially, prompting frontend for token
          geminiApiKey: geminiApiKey || "",
          isActive: true,
        });
        console.log("Created new Firebase-linked user without schoolId.");
        // Re-fetch to populate schoolId (which will be null) for sendTokenResponse
        user = await User.findById(user._id).populate('schoolId');
      }
    } else {
      // Existing Firebase user, just update last login
      user.lastLogin = new Date();
      if (photoURL && photoURL !== user.avatar) user.avatar = photoURL;
      if (geminiApiKey) user.geminiApiKey = geminiApiKey;
      await user.save();
      console.log("Updated existing Firebase user last login.");
    }

    // sendTokenResponse now correctly includes user's role and schoolId (or null)
    // The frontend will use `user.schoolId` to determine if the token modal is needed.
    sendTokenResponse(user, 200, res, "Firebase user synced successfully.");

  } catch (error) {
    console.error("Error in findOrCreateFirebaseUser:", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `User with this ${field} already exists.`,
        errorType: "duplicate_key",
      });
    }
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors,
        errorType: "validation",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while processing Firebase user.",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error.",
      errorType: "server_error",
    });
  }
};