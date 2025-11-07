// backend/model/Student.js
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    studentId: {
      type: String,
      required: [true, "Student ID is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },

    // Class and Academic Info
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class is required"],
      index: true,
    },
    grade: {
      type: String,
      required: [true, "Grade is required"],
      enum: [
        "Standard 1",
        "Standard 2",
        "Standard 3",
        "Standard 4",
        "Standard 5",
        "Standard 6",
        "Form 1",
        "Form 2",
        "Form 3",
        "Form 4",
        "Form 5",
      ],
    },
    rollNumber: {
      type: Number,
      min: [1, "Roll number must be positive"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", ""],
      default: "",
    },

    // Profile Information
    dateOfBirth: {
      type: Date,
    },
    parentContact: {
      name: String,
      phone: String,
      email: String,
    },
    avatar: {
      type: String,
      default: "",
    },

    // Academic Performance
    performanceStats: {
      totalAssessments: {
        type: Number,
        default: 0,
      },
      averageScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      lastAssessmentDate: Date,
      submissionRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },

    // Status and Metadata
    status: {
      type: String,
      enum: ["active", "inactive", "graduated", "transferred"],
      default: "active",
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },

    // Relationship to User (Teacher)
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
studentSchema.index({ classId: 1, status: 1 });
// Note: 'studentId' field already has unique index, no need to create duplicate
studentSchema.index({ addedBy: 1 });
studentSchema.index({ name: "text", studentId: "text" });

// Virtual for full display name
studentSchema.virtual("displayName").get(function () {
  return `${this.name} (${this.studentId})`;
});

// Virtual populate for answers
studentSchema.virtual("answers", {
  ref: "StudentAnswer",
  localField: "_id",
  foreignField: "studentId",
  justOne: false,
});

// Instance method to update performance stats
studentSchema.methods.updatePerformanceStats = async function () {
  const StudentAnswer = mongoose.model("StudentAnswer");

  const answers = await StudentAnswer.find({
    studentId: this._id,
    processingStatus: "completed",
  });

  if (answers.length > 0) {
    const totalScore = answers.reduce(
      (sum, answer) => sum + (answer.overallStats.percentage || 0),
      0
    );

    this.performanceStats.totalAssessments = answers.length;
    this.performanceStats.averageScore = totalScore / answers.length;
    this.performanceStats.lastAssessmentDate =
      answers[answers.length - 1].submittedAt;

    return this.save();
  }
};

// Static method to get students by class
studentSchema.statics.getByClass = function (classId, status = "active") {
  return this.find({ classId, status }).sort({ rollNumber: 1, name: 1 });
};

// Static method to search students
studentSchema.statics.searchStudents = function (query, classId = null) {
  const searchQuery = {
    $or: [
      { name: { $regex: query, $options: "i" } },
      { studentId: { $regex: query, $options: "i" } },
    ],
  };

  if (classId) {
    searchQuery.classId = classId;
  }

  return this.find(searchQuery)
    .populate("classId", "className grade")
    .sort({ name: 1 });
};

// Pre-remove hook to clean up related data
studentSchema.pre("remove", async function (next) {
  // Delete all student answers
  await mongoose.model("StudentAnswer").deleteMany({ studentId: this._id });
  next();
});

module.exports = mongoose.model("Student", studentSchema);
