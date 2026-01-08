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
      required: false,
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
      enum: [
        "assessment",
        "essay",
        "textbook",
        "activity",
        "activityInClass",
        "spm-exam",
      ], // FIXED: Added activityInClass and spm-exam
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

    // FIXED: Enhanced generatedContent schema with explicit SPM exam fields
    generatedContent: {
      // JSON Content Fields
      activityContent: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      rubricContent: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      assessmentContent: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      answerKeyContent: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      examContent: {
        // CRITICAL: SPM exam content
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },

      // HTML Fields - These are what the frontend looks for
      activityHTML: {
        type: String,
        default: null,
      },
      rubricHTML: {
        type: String,
        default: null,
      },
      assessmentHTML: {
        type: String,
        default: null,
      },
      answerKeyHTML: {
        type: String,
        default: null,
      },
      examHTML: {
        // CRITICAL: SPM exam HTML
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

      // Legacy field for backwards compatibility
      aiResponse: {
        type: mongoose.Schema.Types.Mixed,
      },
    },

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
    regeneratedAt: {
      type: Date,
    },
    regenerationCount: {
      type: Number,
      default: 0,
    },
    originalCreatedAt: {
      type: Date,
    },

    // FIXED: Enhanced exam configuration for SPM exams
    examConfiguration: {
      paperType: {
        type: String,
        enum: ["paper1", "paper2"],
      },
      textSources: [String],
      readingLevel: String,
      topics: [String],
      communicationFormat: String,
      essayTypes: [String],
      topicCategories: [String],
      promptComplexity: String,
      questionTypes: {
        multipleChoiceOptions: Number,
        clozeTestFocus: String,
        matchingComplexity: String,
      },
    },

    // FIXED: Add standalone flag
    isStandalone: {
      type: Boolean,
      default: false,
    },

    // Cached submission statistics for performance
    submissionStats: {
      totalStudentsInClass: {
        type: Number,
        default: 0,
      },
      totalSubmissions: {
        type: Number,
        default: 0,
      },
      completedSubmissions: {
        type: Number,
        default: 0,
      },
      pendingSubmissions: {
        type: Number,
        default: 0,
      },
      submissionRate: {
        type: Number,
        default: 0,
      },
      overallAverage: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: null,
      },
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

// Indexes for better query performance
AssessmentSchema.index({ createdBy: 1, createdAt: -1 });
AssessmentSchema.index({ lessonPlanId: 1 });
AssessmentSchema.index({ classId: 1 });
AssessmentSchema.index({ activityType: 1, status: 1 });
AssessmentSchema.index({ tags: 1 });
AssessmentSchema.index({ isStandalone: 1 }); // FIXED: Add index for standalone assessments

// Virtual for formatted creation date
AssessmentSchema.virtual("formattedCreatedDate").get(function () {
  return this.createdAt ? this.createdAt.toLocaleDateString() : null;
});

// FIXED: Enhanced instance method to update usage statistics
AssessmentSchema.methods.recordUsage = function () {
  this.lastUsed = new Date();
  this.usageCount += 1;
  return this.save();
};

// FIXED: Enhanced method to mark content generated with SPM exam support
AssessmentSchema.methods.markContentGenerated = function (
  studentContent,
  teacherContent,
  activityType
) {
  if (activityType === "assessment") {
    this.generatedContent.assessmentContent = studentContent;
    this.generatedContent.answerKeyContent = teacherContent;
  } else if (activityType === "spm-exam") {
    // CRITICAL: Handle SPM exam content correctly
    this.generatedContent.examContent = studentContent;
    this.generatedContent.assessmentContent = studentContent; // Also populate assessmentContent
    this.generatedContent.answerKeyContent = teacherContent;
  } else {
    this.generatedContent.activityContent = studentContent;
    this.generatedContent.rubricContent = teacherContent;
  }

  this.generatedContent.hasStudentContent = !!studentContent;
  this.generatedContent.hasTeacherContent = !!teacherContent;
  this.hasActivity = !!studentContent;
  this.hasRubric = !!teacherContent;
  this.status = "Generated";

  return this.save();
};

// FIXED: Static method to get user's assessments with filters
AssessmentSchema.statics.getUserAssessments = function (userId, filters = {}) {
  const query = { createdBy: userId };

  if (filters.classId) query.classId = filters.classId;
  if (filters.activityType) query.activityType = filters.activityType;
  if (filters.status) query.status = filters.status;
  if (filters.hasLessonPlan !== undefined) {
    if (filters.hasLessonPlan === "true") {
      query.lessonPlanId = { $exists: true, $ne: null };
    } else if (filters.hasLessonPlan === "false") {
      query.$or = [
        { lessonPlanId: { $exists: false } },
        { lessonPlanId: null },
        { isStandalone: true },
      ];
    }
  }
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

// FIXED: Static method to update submission statistics for an assessment
AssessmentSchema.statics.updateSubmissionStats = async function (assessmentId) {
  try {
    const Assessment = this;
    const StudentAnswer = require("./StudentAnswer");
    const Class = require("./Class");

    // Get assessment with class info
    const assessment = await Assessment.findById(assessmentId).populate(
      "classId",
      "students classStats"
    );

    if (!assessment) {
      console.error("Assessment not found:", assessmentId);
      return null;
    }

    // Get total students in class
    const totalStudentsInClass =
      assessment.classId?.classStats?.totalStudents ||
      assessment.classId?.students?.length ||
      0;

    // Get all submissions for this assessment
    const submissions = await StudentAnswer.find({ assessmentId });

    // Count completed vs pending submissions
    const completedSubmissions = submissions.filter(
      (s) => s.processingStatus === "completed"
    ).length;
    const pendingSubmissions = submissions.length - completedSubmissions;

    // Calculate overall average (only from completed submissions)
    let overallAverage = 0;
    if (completedSubmissions > 0) {
      const completedSubs = submissions.filter(
        (s) => s.processingStatus === "completed"
      );
      const totalPercentage = completedSubs.reduce(
        (sum, sub) => sum + (sub.overallStats?.percentage || 0),
        0
      );
      overallAverage = totalPercentage / completedSubmissions;
    }

    // Calculate submission rate
    const submissionRate =
      totalStudentsInClass > 0
        ? (submissions.length / totalStudentsInClass) * 100
        : 0;

    // Update the assessment's submissionStats
    assessment.submissionStats = {
      totalStudentsInClass,
      totalSubmissions: submissions.length,
      completedSubmissions,
      pendingSubmissions,
      submissionRate: parseFloat(submissionRate.toFixed(1)),
      overallAverage: parseFloat(overallAverage.toFixed(1)),
      lastUpdated: new Date(),
    };

    await assessment.save();
    return assessment.submissionStats;
  } catch (error) {
    console.error("Error updating submission stats:", error);
    return null;
  }
};

// FIXED: Enhanced pre-save middleware with SPM exam support
AssessmentSchema.pre("save", function (next) {
  // Update hasActivity and hasRubric based on content availability
  const content = this.generatedContent;

  if (this.activityType === "assessment") {
    this.hasActivity = !!(content.assessmentContent || content.assessmentHTML);
    this.hasRubric = !!(content.answerKeyContent || content.answerKeyHTML);
  } else if (this.activityType === "spm-exam") {
    // CRITICAL: Handle SPM exam content correctly
    this.hasActivity = !!(
      content.examContent ||
      content.examHTML ||
      content.assessmentContent ||
      content.assessmentHTML
    );
    this.hasRubric = !!(content.answerKeyContent || content.answerKeyHTML);
  } else {
    this.hasActivity = !!(content.activityContent || content.activityHTML);
    this.hasRubric = !!(content.rubricContent || content.rubricHTML);
  }

  // Update status based on content availability
  if (this.hasActivity && this.hasRubric && this.status === "Generated") {
    this.status = "Completed";
  } else if (this.hasActivity || this.hasRubric) {
    this.status = "Generated";
  }

  // PHASE 6: Increment version on updates (not on new documents)
  if (this.isModified() && !this.isNew) {
    this.version = (this.version || 1) + 1;
    this.syncStatus = "pending";
  }

  next();
});

module.exports = mongoose.model("Assessment", AssessmentSchema);
