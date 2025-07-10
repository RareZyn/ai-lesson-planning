// models/User.js - Updated with geminiApiKey field
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Simple encryption for API keys
const algorithm = "aes-256-gcm";
const encrypt = (text, secret) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(secret, "hex"),
    iv
  );

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
};

const decrypt = (text, secret) => {
  const parts = text.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(secret, "hex"),
    iv
  );
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        // Password is required only if there's no googleId (regular email/password users)
        return !this.googleId;
      },
      minlength: [6, "Password must be at least 6 characters"],
    },
    schoolName: {
      type: String,
      // required: [true, "School name is required"],
      trim: true,
    },
    geminiApiKey: {
      type: String,
      default: "",
      select: false, // Don't include in queries by default for security
    },
    roles: {
      type: [String],
      default: ["teacher"],
      enum: ["teacher", "admin", "student"],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
      sparse: true, // Allows multiple null values but unique non-null values
      unique: true,
    },
    firebaseUid: {
      type: String,
      sparse: true, // Link to Firebase user
      unique: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // NEW: Bookmarks field for storing user's bookmarked lesson plans
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LessonPlan",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Get encryption secret from environment variable
const getEncryptionSecret = () => {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret || secret.length !== 64) {
    throw new Error("ENCRYPTION_SECRET must be a 64-character hex string");
  }
  return secret;
};

// Pre-save hook to encrypt Gemini API key
userSchema.pre("save", async function (next) {
  try {
    // Encrypt Gemini API key if it's modified and exists
    if (this.isModified("geminiApiKey") && this.geminiApiKey) {
      const secret = getEncryptionSecret();
      this.geminiApiKey = encrypt(this.geminiApiKey, secret);
    }

    // Hash password if modified (existing logic)
    if (this.isModified("password") && this.password) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to get decrypted Gemini API key
userSchema.methods.getGeminiApiKey = function () {
  if (!this.geminiApiKey) return null;

  try {
    const secret = getEncryptionSecret();
    return decrypt(this.geminiApiKey, secret);
  } catch (error) {
    console.error("Failed to decrypt Gemini API key:", error);
    return null;
  }
};

// Instance method to check password (only for users with passwords)
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    throw new Error("User does not have a password set");
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to add bookmark
userSchema.methods.addBookmark = function (lessonPlanId) {
  if (!this.bookmarks.includes(lessonPlanId)) {
    this.bookmarks.push(lessonPlanId);
  }
  return this.save();
};

// Instance method to remove bookmark
userSchema.methods.removeBookmark = function (lessonPlanId) {
  this.bookmarks = this.bookmarks.filter(
    (id) => id.toString() !== lessonPlanId.toString()
  );
  return this.save();
};

// Instance method to check if lesson is bookmarked
userSchema.methods.hasBookmarked = function (lessonPlanId) {
  return this.bookmarks.some((id) => id.toString() === lessonPlanId.toString());
};

// Instance method to transform user object (remove sensitive data)
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.geminiApiKey; // Never expose encrypted API key
  delete userObject.__v;
  return userObject;
};

// Static method to find user by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find user by Google ID
userSchema.statics.findByGoogleId = function (googleId) {
  return this.findOne({ googleId });
};

// Static method to find user by Firebase UID
userSchema.statics.findByFirebaseUid = function (firebaseUid) {
  return this.findOne({ firebaseUid });
};

module.exports = mongoose.model("User", userSchema);
