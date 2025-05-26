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

    const { name, email, password, schoolName } = req.body;

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

    // Check password
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
    const { googleId, email, name, avatar, schoolName } = req.body;

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
          password: Math.random().toString(36).slice(-8), // Generate random password
          schoolName,
          googleId,
          avatar: avatar || "",
          isEmailVerified: true, // Assume Google emails are verified
        });
      }
    } else {
      // Update last login for existing Google user
      user.lastLogin = new Date();
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
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
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
    const { name, schoolName } = req.body;

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

// @desc    Change password
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
