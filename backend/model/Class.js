// backend/model/Class.js
const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: [true, "Please add a class name"],
      trim: true,
      maxlength: [50, "Class name cannot exceed 50 characters"],
      unique: true,
    },
    grade: {
      type: String,
      required: [true, "Please add a grade"],
      enum: {
        values: [
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
        message: "Please select a valid grade",
      },
    },
    subject: {
      type: String,
      required: [true, "Please add a subject"],
      enum: {
        values: ["English", "Mathematics", "Science", "History", "Geography"],
        message: "Please select a valid subject",
      },
    },
    year: {
      type: String,
      required: [true, "Please add a year"],
      enum: {
        values: ["2023", "2024", "2025", "2026"],
        message: "Please select a valid year",
      },
    },

    // NEW: Students array
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    // NEW: Class statistics
    classStats: {
      totalStudents: {
        type: Number,
        default: 0,
      },
      activeStudents: {
        type: Number,
        default: 0,
      },
      averagePerformance: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      lastUpdated: Date,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },

    // ===== PHASE 6: OFFLINE SYNC SUPPORT =====
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    syncStatus: {
      type: String,
      enum: ["synced", "pending", "conflict", "error"],
      default: "synced",
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
    offlineCreated: {
      type: Boolean,
      default: false,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    conflictData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // ===== END PHASE 6 =====
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Prevent duplicate classes
classSchema.index({ className: 1, year: 1 }, { unique: true });

// Reverse populate with virtuals
classSchema.virtual("lessons", {
  ref: "Lesson",
  localField: "_id",
  foreignField: "class",
  justOne: false,
});

// NEW: Virtual populate for students
classSchema.virtual("studentsList", {
  ref: "Student",
  localField: "_id",
  foreignField: "classId",
  justOne: false,
});

// NEW: Instance method to add student
classSchema.methods.addStudent = async function (studentId) {
  if (!this.students.includes(studentId)) {
    this.students.push(studentId);
    this.classStats.totalStudents = this.students.length;

    // Update active students count
    const Student = mongoose.model("Student");
    const activeCount = await Student.countDocuments({
      classId: this._id,
      status: "active",
    });
    this.classStats.activeStudents = activeCount;
    this.classStats.lastUpdated = new Date();

    return this.save();
  }
  return this;
};

// NEW: Instance method to remove student
classSchema.methods.removeStudent = async function (studentId) {
  this.students = this.students.filter(
    (id) => id.toString() !== studentId.toString()
  );
  this.classStats.totalStudents = this.students.length;

  // Update active students count
  const Student = mongoose.model("Student");
  const activeCount = await Student.countDocuments({
    classId: this._id,
    status: "active",
  });
  this.classStats.activeStudents = activeCount;
  this.classStats.lastUpdated = new Date();

  return this.save();
};

// NEW: Instance method to update class statistics
classSchema.methods.updateClassStats = async function () {
  const Student = mongoose.model("Student");

  const students = await Student.find({ classId: this._id, status: "active" });

  if (students.length > 0) {
    const totalPerformance = students.reduce(
      (sum, student) => sum + (student.performanceStats.averageScore || 0),
      0
    );

    this.classStats.averagePerformance = totalPerformance / students.length;
  } else {
    this.classStats.averagePerformance = 0;
  }

  this.classStats.activeStudents = students.length;
  this.classStats.totalStudents = this.students.length;
  this.classStats.lastUpdated = new Date();

  return this.save();
};

// PHASE 6: Pre-save middleware for version tracking
classSchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    this.version = (this.version || 1) + 1;
    this.syncStatus = "pending";
    this.lastModifiedBy = this.createdBy;
  }
  next();
});

module.exports = mongoose.model("Class", classSchema);
