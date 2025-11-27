// backend/model/StudentAnswer.js
const mongoose = require("mongoose");

const studentAnswerSchema = new mongoose.Schema(
  {
    // Core References
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
      index: true,
    },
    lessonPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LessonPlan",
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    // Submission Info
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    submissionMethod: {
      type: String,
      enum: ["upload_image", "manual_text", "typed_answer"],
      required: true,
    },

    // Answer Sheet Image (for SPM - store once instead of per answer)
    answerSheetImage: {
      type: String, // Base64 or URL - stored once for entire sheet
    },

    // Question-Answer Pairs (Array for multiple questions)
    answers: [
      {
        questionNumber: {
          type: Number,
          required: true,
        },
        questionText: String, // Optional: store for easy reference

        // Original Submission
        originalImage: {
          type: String, // Base64 or URL to stored image
          uploadedAt: Date,
        },

        // OCR Processing (FR-007)
        ocrData: {
          extractedText: String,
          confidence: Number,
          metadata: {
            language: String,
            textType: String,
            legibility: String,
            processingTime: String,
            model: String,
          },
          processedAt: Date,
        },

        // Manual Edits (FR-011)
        editedText: String, // If teacher manually corrects OCR
        isEdited: {
          type: Boolean,
          default: false,
        },
        editedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        editedAt: Date,

        // Grading (FR-008, FR-009)
        grading: {
          rubricUsed: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Rubric", // Or embed rubric snapshot
          },

          // AI Scoring
          aiScore: {
            score: Number,
            maxScore: Number,
            percentage: Number,
            feedback: String,
            reasoning: String, // Why this score was given
            scoredAt: Date,
          },

          // Manual Override (FR-011)
          finalScore: Number,
          isManuallyAdjusted: {
            type: Boolean,
            default: false,
          },
          adjustedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          adjustedAt: Date,
          adjustmentReason: String,

          // Comparison metadata
          comparisonMetadata: {
            semanticSimilarity: Number,
            keyPointsMatched: [String],
            keyPointsMissed: [String],
          },
        },

        // Status tracking
        status: {
          type: String,
          enum: [
            "pending_ocr",
            "ocr_completed",
            "pending_grading",
            "graded",
            "reviewed",
          ],
          default: "pending_ocr",
        },
      },
    ],

    // Overall Assessment Stats
    overallStats: {
      totalQuestions: Number,
      questionsAttempted: Number,
      totalScore: Number,
      maxPossibleScore: Number,
      percentage: Number,
      averageConfidence: Number, // Average OCR confidence
      processingTime: Number, // Total time for all processing
    },

    // Processing Status
    processingStatus: {
      type: String,
      enum: [
        "pending",
        "processing_ocr",
        "processing_grading",
        "completed",
        "requires_review",
        "error",
      ],
      default: "pending",
    },

    // Error Tracking (renamed from 'errors' to avoid Mongoose reserved keyword)
    processingErrors: [
      {
        stage: String, // 'ocr', 'grading', etc.
        questionNumber: Number,
        message: String,
        timestamp: Date,
      },
    ],

    // Teacher Review
    teacherReview: {
      reviewed: {
        type: Boolean,
        default: false,
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reviewedAt: Date,
      comments: String,
      flaggedForRegrade: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
studentAnswerSchema.index({ assessmentId: 1, studentId: 1 });
studentAnswerSchema.index({ classId: 1, submittedAt: -1 });
studentAnswerSchema.index({ processingStatus: 1 });
studentAnswerSchema.index({ "answers.status": 1 });

// Instance method to calculate overall stats
studentAnswerSchema.methods.calculateOverallStats = function () {
  if (!this.answers || this.answers.length === 0) return;

  const stats = {
    totalQuestions: this.answers.length,
    questionsAttempted: 0,
    totalScore: 0,
    maxPossibleScore: 0,
    percentage: 0,
    averageConfidence: 0,
    processingTime: 0,
  };

  let confidenceSum = 0;
  let confidenceCount = 0;

  this.answers.forEach((answer) => {
    if (answer.ocrData && answer.ocrData.extractedText) {
      stats.questionsAttempted++;
    }

    if (answer.ocrData && answer.ocrData.confidence) {
      confidenceSum += answer.ocrData.confidence;
      confidenceCount++;
    }

    if (answer.grading && answer.grading.finalScore !== undefined) {
      stats.totalScore += answer.grading.finalScore;
    } else if (
      answer.grading &&
      answer.grading.aiScore &&
      answer.grading.aiScore.score !== undefined
    ) {
      stats.totalScore += answer.grading.aiScore.score;
    }

    if (
      answer.grading &&
      answer.grading.aiScore &&
      answer.grading.aiScore.maxScore
    ) {
      stats.maxPossibleScore += answer.grading.aiScore.maxScore;
    }
  });

  if (confidenceCount > 0) {
    stats.averageConfidence = confidenceSum / confidenceCount;
  }

  if (stats.maxPossibleScore > 0) {
    stats.percentage = (stats.totalScore / stats.maxPossibleScore) * 100;
  }

  this.overallStats = stats;
  return stats;
};

// Instance method to add error
studentAnswerSchema.methods.addError = function (
  stage,
  questionNumber,
  message
) {
  this.processingErrors.push({
    stage,
    questionNumber,
    message,
    timestamp: new Date(),
  });
  this.processingStatus = "error";
  return this.save();
};

// Static method to get submissions for review
studentAnswerSchema.statics.getForReview = function (filters = {}) {
  const query = { processingStatus: "requires_review" };

  if (filters.classId) query.classId = filters.classId;
  if (filters.assessmentId) query.assessmentId = filters.assessmentId;

  return this.find(query)
    .populate("studentId", "name studentId")
    .populate("assessmentId", "title")
    .sort({ submittedAt: -1 });
};

// Static method to get submissions by confidence threshold
studentAnswerSchema.statics.getLowConfidenceSubmissions = function (
  threshold = 0.6
) {
  return this.find({
    "overallStats.averageConfidence": { $lt: threshold },
    processingStatus: { $in: ["completed", "processing_grading"] },
  })
    .populate("studentId", "name studentId")
    .populate("assessmentId", "title")
    .sort({ "overallStats.averageConfidence": 1 });
};

// Pre-save middleware to update processing status
studentAnswerSchema.pre("save", function (next) {
  // Check if all answers have been processed
  if (this.answers && this.answers.length > 0) {
    const allOCRCompleted = this.answers.every(
      (a) =>
        a.status === "ocr_completed" ||
        a.status === "pending_grading" ||
        a.status === "graded" ||
        a.status === "reviewed"
    );

    const allGraded = this.answers.every(
      (a) => a.status === "graded" || a.status === "reviewed"
    );

    const lowConfidence = this.answers.some(
      (a) => a.ocrData && a.ocrData.confidence < 0.6
    );

    if (allGraded && !lowConfidence) {
      this.processingStatus = "completed";
    } else if (allGraded && lowConfidence) {
      this.processingStatus = "requires_review";
    } else if (allOCRCompleted) {
      this.processingStatus = "processing_grading";
    }
  }

  next();
});

module.exports = mongoose.model("StudentAnswer", studentAnswerSchema);
