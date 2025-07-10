// controllers/authController.js 
const User = require("../model/User");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

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

  res.status(statusCode).cookie("token", token, cookieOptions).json({
    success: true,
    message,
    token,
    user,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { name, email, password, schoolName, firebaseUid, geminiApiKey } =
      req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      schoolName,
      firebaseUid, // Link to Firebase user
      geminiApiKey: geminiApiKey || "", // Store Gemini API key if provided
    });

    sendTokenResponse(user, 201, res, "Registration successful");
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findByEmail(email).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account has been deactivated",
      });
    }

    // Check password (only if user has a password - some users might be Google-only)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "Please use Google sign-in for this account",
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login
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

// @desc    Google OAuth login/register
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res) => {
  try {
    const { googleId, email, name, avatar, schoolName, geminiApiKey } =
      req.body;

    if (!googleId || !email) {
      return res.status(400).json({
        success: false,
        message: "Google ID and email are required",
      });
    }

    let user = await User.findByGoogleId(googleId);

    if (!user) {
      // Check if user exists with this email but no Google ID
      user = await User.findByEmail(email);

      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        if (avatar) user.avatar = avatar;
        if (geminiApiKey) user.geminiApiKey = geminiApiKey; // Update API key if provided
        user.lastLogin = new Date();
        await user.save();
      } else {
        // Create new user
        if (!name || !schoolName) {
          return res.status(400).json({
            success: false,
            message: "Name and school name are required for new users",
          });
        }

        user = await User.create({
          name,
          email,
          schoolName,
          googleId,
          avatar: avatar || "",
          geminiApiKey: geminiApiKey || "", // Store Gemini API key if provided
          isEmailVerified: true, // Assume Google emails are verified
          // No password for Google users
        });
      }
    } else {
      // Update last login and API key for existing Google user
      user.lastLogin = new Date();
      if (geminiApiKey) user.geminiApiKey = geminiApiKey;
      await user.save();
    }

    sendTokenResponse(user, 200, res, "Google authentication successful");
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during Google authentication",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("+geminiApiKey");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Include decrypted API key status (not the actual key)
    const userResponse = user.toJSON();
    userResponse.hasGeminiApiKey = !!user.geminiApiKey;

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
    const { name, schoolName, geminiApiKey } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (schoolName) user.schoolName = schoolName;
    if (geminiApiKey !== undefined) user.geminiApiKey = geminiApiKey; // Allow empty string to remove key

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during profile update",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// @desc    Change password (only for non-Google users)
// @route   PUT /api/auth/password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    // Check if user has a password (Google users don't have passwords)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "Cannot change password for Google-authenticated accounts",
      });
    }

    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
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

// @desc    Get Gemini API key
// @route   GET /api/auth/gemini-key
// @access  Private
exports.getGeminiApiKey = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("+geminiApiKey");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const apiKey = user.getGeminiApiKey();

    res.status(200).json({
      success: true,
      hasApiKey: !!apiKey,
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

// @desc    Update Gemini API key
// @route   PUT /api/auth/gemini-key
// @access  Private
exports.updateGeminiApiKey = async (req, res) => {
  try {
    const { apiKey } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
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
 * @route   POST /api/auth/firebase-user
 * @access  Public
 */
exports.findOrCreateFirebaseUser = async (req, res) => {
  try {
    console.log("Firebase user sync request received:", req.body);

    const { firebaseUid, email, name, displayName, photoURL, geminiApiKey } =
      req.body;

    // Enhanced validation with better error messages
    if (!firebaseUid) {
      console.error("Missing firebaseUid in request");
      return res.status(400).json({
        success: false,
        message: "Firebase UID is required",
        missingField: "firebaseUid",
      });
    }

    if (!email) {
      console.error("Missing email in request");
      return res.status(400).json({
        success: false,
        message: "Email is required",
        missingField: "email",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Invalid email format:", email);
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
        invalidField: "email",
      });
    }

    console.log("Looking for existing user with Firebase UID:", firebaseUid);

    // Try to find existing user by Firebase UID
    let user = await User.findOne({ firebaseUid });

    if (!user) {
      console.log("No user found with Firebase UID, checking by email:", email);
      // Try to find by email (in case user exists but doesn't have firebaseUid set)
      user = await User.findOne({ email: email.toLowerCase() });

      if (user) {
        console.log("Found existing user by email, updating with Firebase UID");
        // Update existing user with Firebase UID
        user.firebaseUid = firebaseUid;
        user.lastLogin = new Date();
        if (photoURL) user.avatar = photoURL;
        if (displayName && !user.name) user.name = displayName;
        if (geminiApiKey) user.geminiApiKey = geminiApiKey; // Update API key if provided
        await user.save();
        console.log("Successfully updated existing user");
      } else {
        console.log("No existing user found, creating new user");
        // Create new user with better defaults
        const userName = name || displayName || email.split("@")[0] || "User";

        user = await User.create({
          firebaseUid,
          email: email.toLowerCase(),
          name: userName,
          roles: ["teacher"], // Default role
          isEmailVerified: true, // Assume Firebase users are verified
          lastLogin: new Date(),
          avatar: photoURL || "",
          schoolName: "", // Will be set later by user
          geminiApiKey: geminiApiKey || "", // Store Gemini API key if provided
          isActive: true,
        });
        console.log("Successfully created new user:", user._id);
      }
    } else {
      console.log("Found existing user with Firebase UID, updating last login");
      // Update last login and photo if provided
      user.lastLogin = new Date();
      if (photoURL && photoURL !== user.avatar) {
        user.avatar = photoURL;
      }
      if (geminiApiKey) user.geminiApiKey = geminiApiKey; // Update API key if provided
      await user.save();
      console.log("Successfully updated existing Firebase user");
    }

    // Return consistent user object
    const userResponse = {
      _id: user._id,
      id: user._id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      firebaseUid: user.firebaseUid,
      schoolName: user.schoolName || "",
      lastLogin: user.lastLogin,
      avatar: user.avatar || "",
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      hasGeminiApiKey: !!user.geminiApiKey,
    };

    console.log("Sending successful response for user:", user._id);

    res.status(200).json({
      success: true,
      message: "Firebase user synced successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Error in findOrCreateFirebaseUser:", error);

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `User with this ${field} already exists`,
        errorType: "duplicate_key",
      });
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
        errorType: "validation",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while processing Firebase user",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
      errorType: "server_error",
    });
  }
};
