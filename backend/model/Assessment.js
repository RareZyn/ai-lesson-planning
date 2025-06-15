// backend/model/Assessment.js
const mongoose = require("mongoose");

const AssessmentSchema = new mongoose.Schema(
  {
    // Core identification
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    // Relationships
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lessonPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LessonPlan",
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    // Assessment type and metadata
    activityType: {
      type: String,
      required: true,
      enum: ["assessment", "essay", "textbook", "activity"],
    },
    assessmentType: {
      type: String,
      required: true,
      trim: true,
    },

    // Assessment configuration
    questionCount: {
      type: Number,
      min: [1, "Must have at least 1 question"],
      max: [100, "Cannot exceed 100 questions"],
    },
    duration: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Intermediate",
    },

    // Skills being assessed
    skills: [
      {
        type: String,
        trim: true,
      },
    ],

    // Generated content from AI
    generatedContent: {
      // Activity HTML content
      activityHTML: {
        type: String,
      },
      // Rubric HTML content
      rubricHTML: {
        type: String,
      },
      // Raw AI response data
      aiResponse: {
        type: mongoose.Schema.Types.Mixed,
      },
    },

    // Original lesson plan data snapshot (for reference)
    lessonPlanSnapshot: {
      title: String,
      subject: String,
      grade: String,
      contentStandard: {
        main: String,
        component: String,
      },
      learningStandard: {
        main: String,
        component: String,
      },
      learningOutline: {
        pre: String,
        during: String,
        post: String,
      },
    },

    // Status and flags
    status: {
      type: String,
      enum: ["Draft", "Generated", "Completed"],
      default: "Draft",
    },
    hasActivity: {
      type: Boolean,
      default: false,
    },
    hasRubric: {
      type: Boolean,
      default: false,
    },

    // Additional metadata
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },

    // Usage tracking
    lastUsed: {
      type: Date,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
AssessmentSchema.index({ createdBy: 1, createdAt: -1 });
AssessmentSchema.index({ lessonPlanId: 1 });
AssessmentSchema.index({ classId: 1 });
AssessmentSchema.index({ activityType: 1, status: 1 });
AssessmentSchema.index({ tags: 1 });

// Virtual for formatted creation date
AssessmentSchema.virtual("formattedCreatedDate").get(function () {
  return this.createdAt.toLocaleDateString();
});

// Instance method to update usage statistics
AssessmentSchema.methods.recordUsage = function () {
  this.lastUsed = new Date();
  this.usageCount += 1;
  return this.save();
};

// Instance method to mark as having activity
AssessmentSchema.methods.markActivityGenerated = function (activityHTML) {
  this.hasActivity = true;
  this.generatedContent.activityHTML = activityHTML;
  this.status = "Generated";
  return this.save();
};

// Instance method to mark as having rubric
AssessmentSchema.methods.markRubricGenerated = function (rubricHTML) {
  this.hasRubric = true;
  this.generatedContent.rubricHTML = rubricHTML;
  if (this.hasActivity) {
    this.status = "Completed";
  }
  return this.save();
};

// Static method to get user's assessments with filters
AssessmentSchema.statics.getUserAssessments = function (userId, filters = {}) {
  const query = { createdBy: userId };

  if (filters.classId) query.classId = filters.classId;
  if (filters.activityType) query.activityType = filters.activityType;
  if (filters.status) query.status = filters.status;
  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: "i" } },
      { description: { $regex: filters.search, $options: "i" } },
      { assessmentType: { $regex: filters.search, $options: "i" } },
    ];
  }

  return this.find(query)
    .populate("lessonPlanId", "parameters plan")
    .populate("classId", "className grade subject")
    .sort({ createdAt: -1 });
};

// Pre-save middleware to update status
AssessmentSchema.pre("save", function (next) {
  if (this.hasActivity && this.hasRubric && this.status === "Generated") {
    this.status = "Completed";
  }
  next();
});

module.exports = mongoose.model("Assessment", AssessmentSchema);
