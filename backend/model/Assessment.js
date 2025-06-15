// backend/model/Assessment.js - Updated to support all content types
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

    // UPDATED: Generated content from AI - supports all content types
    generatedContent: {
      // For activity, essay, textbook types
      activityHTML: {
        type: String,
        default: null,
      },
      rubricHTML: {
        type: String,
        default: null,
      },

      // For assessment type
      assessmentHTML: {
        type: String,
        default: null,
      },
      answerKeyHTML: {
        type: String,
        default: null,
      },

      // Metadata fields
      hasStudentContent: {
        type: Boolean,
        default: false,
      },
      hasTeacherContent: {
        type: Boolean,
        default: false,
      },
      generatedAt: {
        type: Date,
        default: Date.now,
      },

      // Raw AI response data (for debugging)
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

// UPDATED: Instance method to update usage statistics
AssessmentSchema.methods.recordUsage = function () {
  this.lastUsed = new Date();
  this.usageCount += 1;
  return this.save();
};

// UPDATED: Instance method to mark content generated based on activity type
AssessmentSchema.methods.markContentGenerated = function (
  studentContent,
  teacherContent,
  activityType
) {
  if (activityType === "assessment") {
    this.generatedContent.assessmentHTML = studentContent;
    this.generatedContent.answerKeyHTML = teacherContent;
  } else {
    this.generatedContent.activityHTML = studentContent;
    this.generatedContent.rubricHTML = teacherContent;
  }

  this.generatedContent.hasStudentContent = !!studentContent;
  this.generatedContent.hasTeacherContent = !!teacherContent;
  this.hasActivity = !!studentContent;
  this.hasRubric = !!teacherContent;
  this.status = "Generated";

  return this.save();
};

// UPDATED: Static method to get user's assessments with filters
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

// UPDATED: Pre-save middleware to update status and flags
AssessmentSchema.pre("save", function (next) {
  // Update hasActivity and hasRubric based on content availability
  const content = this.generatedContent;

  if (this.activityType === "assessment") {
    this.hasActivity = !!content.assessmentHTML;
    this.hasRubric = !!content.answerKeyHTML;
  } else {
    this.hasActivity = !!content.activityHTML;
    this.hasRubric = !!content.rubricHTML;
  }

  // Update status based on content availability
  if (this.hasActivity && this.hasRubric && this.status === "Generated") {
    this.status = "Completed";
  } else if (this.hasActivity || this.hasRubric) {
    this.status = "Generated";
  }

  next();
});

module.exports = mongoose.model("Assessment", AssessmentSchema);
