// routes/auth.js - Updated with Gemini API key routes
const express = require("express");
const { body } = require("express-validator");
const {
  registerTeacherWithToken,
  registerSchool,
  googleRegisterSchool,
  login,
  googleAuthWithToken,
  findOrCreateFirebaseUser,
  getMe,
  updateProfile,
  logout,
  changePassword,
  getGeminiApiKey,
  updateGeminiApiKey,
} = require("../controller/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Validation rules
const registerValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  body("schoolName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("School name must be between 2 and 100 characters"),
  body("geminiApiKey")
    .optional()
    .trim()
    .isLength({ min: 20 })
    .withMessage("Invalid API key format"),
];

const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("schoolName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("School name must be between 2 and 100 characters"),
  body("geminiApiKey").optional().trim(),
];

const changePasswordValidation = [
  body("currentPassword")
    .optional()
    .notEmpty()
    .withMessage("Current password cannot be empty if provided"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
];

const updateApiKeyValidation = [
  body("apiKey")
    .optional()
    .trim()
    .isLength({ min: 20 })
    .withMessage("Invalid API key format"),
];

// School registration (first user becomes admin)
router.post(
  "/register-school",
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('schoolName').notEmpty().withMessage('School name is required'),
  ],
  registerSchool
);

// Teacher registration with token (for email/password users)
router.post(
  "/register-teacher",
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('registrationToken').notEmpty().withMessage('Registration token is required'),
  ],
  registerTeacherWithToken
);

// Public routes (NO authentication required)
// router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
// router.post("/google", googleAuth);

// New route for Google sign-in requiring a token for new teachers
router.post(
  "/google-register-teacher",
  [
    body('googleId').notEmpty().withMessage('Google ID is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('registrationToken').notEmpty().withMessage('Registration token is required'),
  ],
  googleAuthWithToken
);

// Google sign-in for registering a new school (first user = admin)
router.post(
  "/google-register-school",
  [
    body('googleId').notEmpty().withMessage('Google ID is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('schoolName').notEmpty().withMessage('School name is required'),
  ],
  googleRegisterSchool
);

router.post("/firebase-user", findOrCreateFirebaseUser);

// Protected routes (authentication required)
router.use(protect); // Apply protection middleware to all routes below

router.get("/me", getMe);
router.put("/profile", updateProfileValidation, updateProfile);
router.post("/logout", logout);
router.put("/password", changePasswordValidation, changePassword);

// Gemini API key routes
router.get("/gemini-key", getGeminiApiKey);
router.put("/gemini-key", updateApiKeyValidation, updateGeminiApiKey);

module.exports = router;
