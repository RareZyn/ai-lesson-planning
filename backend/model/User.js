// model/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    schoolName: {
      type: String,
      required: [true, "School name is required"],
      trim: true,
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
  },
  {
    timestamps: true,
  }
);

// Remove the duplicate index definitions since we're using unique: true above
// userSchema.index({ email: 1 });
// userSchema.index({ googleId: 1 });

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to transform user object (remove sensitive data)
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
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

module.exports = mongoose.model("User", userSchema);
