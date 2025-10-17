// backend/controller/reviewController.js
const StudentAnswer = require("../model/StudentAnswer");
const Student = require("../model/Student");

/**
 * @desc    Get submissions requiring review (low confidence, errors, flagged)
 * @route   GET /api/review/submissions
 * @access  Private
 */
exports.getSubmissionsForReview = async (req, res) => {
  try {
    const {
      classId,
      assessmentId,
      minConfidence = 0.6,
      status,
      page = 1,
      limit = 20,
      sortBy = "submittedAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter
    const filter = {};

    if (classId) filter.classId = classId;
    if (assessmentId) filter.assessmentId = assessmentId;

    // Filter by status or confidence
    if (status) {
      filter.processingStatus = status;
    } else {
      // Default: show submissions that need review
      filter.$or = [
        { processingStatus: "requires_review" },
        { processingStatus: "error" },
        {
          "overallStats.averageConfidence": { $lt: parseFloat(minConfidence) },
        },
        { "teacherReview.flaggedForRegrade": true },
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const submissions = await StudentAnswer.find(filter)
      .populate("studentId", "name studentId avatar")
      .populate("assessmentId", "title activityType")
      .populate("classId", "className grade")
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await StudentAnswer.countDocuments(filter);

    // Calculate statistics
    const stats = {
      totalNeedingReview: total,
      lowConfidence: await StudentAnswer.countDocuments({
        ...filter,
        "overallStats.averageConfidence": { $lt: parseFloat(minConfidence) },
      }),
      hasErrors: await StudentAnswer.countDocuments({
        ...filter,
        processingStatus: "error",
      }),
      flaggedForRegrade: await StudentAnswer.countDocuments({
        ...filter,
        "teacherReview.flaggedForRegrade": true,
      }),
    };

    res.status(200).json({
      success: true,
      count: submissions.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      stats,
      data: submissions,
    });
  } catch (error) {
    console.error("Get submissions for review error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching submissions for review",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Mark submission as reviewed
 * @route   PUT /api/review/:submissionId/mark-reviewed
 * @access  Private
 */
exports.markAsReviewed = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { comments, approved = true } = req.body;

    const submission = await StudentAnswer.findById(submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    // Update review status
    submission.teacherReview = {
      reviewed: true,
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      comments: comments || "",
      flaggedForRegrade: !approved,
    };

    // Update processing status if approved
    if (approved && submission.processingStatus === "requires_review") {
      submission.processingStatus = "completed";
    }

    // Update answer statuses
    submission.answers.forEach((answer) => {
      if (answer.status === "graded") {
        answer.status = "reviewed";
      }
    });

    await submission.save();

    res.status(200).json({
      success: true,
      message: approved
        ? "Submission marked as reviewed and approved"
        : "Submission flagged for regrade",
      data: {
        submissionId: submission._id,
        reviewed: true,
        approved,
        comments: submission.teacherReview.comments,
      },
    });
  } catch (error) {
    console.error("Mark as reviewed error:", error);
    res.status(500).json({
      success: false,
      message: "Error marking submission as reviewed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Flag submission for regrade
 * @route   PUT /api/review/:submissionId/flag-regrade
 * @access  Private
 */
exports.flagForRegrade = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { reason } = req.body;

    const submission = await StudentAnswer.findById(submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    submission.teacherReview = {
      ...submission.teacherReview,
      flaggedForRegrade: true,
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      comments: reason || "Flagged for regrade",
    };

    submission.processingStatus = "requires_review";

    await submission.save();

    res.status(200).json({
      success: true,
      message: "Submission flagged for regrade",
      data: {
        submissionId: submission._id,
        flaggedForRegrade: true,
        reason: submission.teacherReview.comments,
      },
    });
  } catch (error) {
    console.error("Flag for regrade error:", error);
    res.status(500).json({
      success: false,
      message: "Error flagging submission for regrade",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Bulk review multiple submissions
 * @route   PUT /api/review/bulk-review
 * @access  Private
 */
exports.bulkReview = async (req, res) => {
  try {
    const { submissionIds, approved = true, comments } = req.body;

    if (
      !submissionIds ||
      !Array.isArray(submissionIds) ||
      submissionIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Submission IDs array is required",
      });
    }

    const updateData = {
      "teacherReview.reviewed": true,
      "teacherReview.reviewedBy": req.user.id,
      "teacherReview.reviewedAt": new Date(),
      "teacherReview.comments": comments || "",
      "teacherReview.flaggedForRegrade": !approved,
    };

    if (approved) {
      updateData.processingStatus = "completed";
    }

    const result = await StudentAnswer.updateMany(
      { _id: { $in: submissionIds } },
      { $set: updateData }
    );

    res.status(200).json({
      success: true,
      message: `Reviewed ${result.modifiedCount} submissions`,
      data: {
        total: submissionIds.length,
        modified: result.modifiedCount,
        approved,
      },
    });
  } catch (error) {
    console.error("Bulk review error:", error);
    res.status(500).json({
      success: false,
      message: "Error performing bulk review",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get low confidence answers across all submissions
 * @route   GET /api/review/low-confidence
 * @access  Private
 */
exports.getLowConfidenceAnswers = async (req, res) => {
  try {
    const { classId, assessmentId, threshold = 0.6, limit = 50 } = req.query;

    const filter = {
      "answers.ocrData.confidence": { $lt: parseFloat(threshold) },
    };

    if (classId) filter.classId = classId;
    if (assessmentId) filter.assessmentId = assessmentId;

    const submissions = await StudentAnswer.find(filter)
      .populate("studentId", "name studentId")
      .populate("assessmentId", "title")
      .limit(parseInt(limit))
      .lean();

    // Extract low confidence answers
    const lowConfidenceAnswers = [];

    submissions.forEach((submission) => {
      submission.answers.forEach((answer) => {
        if (
          answer.ocrData &&
          answer.ocrData.confidence < parseFloat(threshold)
        ) {
          lowConfidenceAnswers.push({
            submissionId: submission._id,
            studentName: submission.studentId?.name,
            assessmentTitle: submission.assessmentId?.title,
            questionNumber: answer.questionNumber,
            extractedText: answer.ocrData.extractedText,
            confidence: answer.ocrData.confidence,
            status: answer.status,
            hasImage: !!answer.originalImage,
          });
        }
      });
    });

    // Sort by confidence (lowest first)
    lowConfidenceAnswers.sort((a, b) => a.confidence - b.confidence);

    res.status(200).json({
      success: true,
      count: lowConfidenceAnswers.length,
      threshold: parseFloat(threshold),
      data: lowConfidenceAnswers,
    });
  } catch (error) {
    console.error("Get low confidence answers error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching low confidence answers",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get review statistics for a class or assessment
 * @route   GET /api/review/statistics
 * @access  Private
 */
exports.getReviewStatistics = async (req, res) => {
  try {
    const { classId, assessmentId } = req.query;

    if (!classId && !assessmentId) {
      return res.status(400).json({
        success: false,
        message: "Either classId or assessmentId is required",
      });
    }

    const filter = {};
    if (classId) filter.classId = classId;
    if (assessmentId) filter.assessmentId = assessmentId;

    // Get all submissions
    const totalSubmissions = await StudentAnswer.countDocuments(filter);

    // Status breakdown
    const statusCounts = await StudentAnswer.aggregate([
      { $match: filter },
      { $group: { _id: "$processingStatus", count: { $sum: 1 } } },
    ]);

    // Review status
    const reviewedCount = await StudentAnswer.countDocuments({
      ...filter,
      "teacherReview.reviewed": true,
    });

    const flaggedCount = await StudentAnswer.countDocuments({
      ...filter,
      "teacherReview.flaggedForRegrade": true,
    });

    // Confidence statistics
    const confidenceStats = await StudentAnswer.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          avgConfidence: { $avg: "$overallStats.averageConfidence" },
          minConfidence: { $min: "$overallStats.averageConfidence" },
          maxConfidence: { $max: "$overallStats.averageConfidence" },
        },
      },
    ]);

    // Score statistics
    const scoreStats = await StudentAnswer.aggregate([
      { $match: { ...filter, processingStatus: "completed" } },
      {
        $group: {
          _id: null,
          avgPercentage: { $avg: "$overallStats.percentage" },
          minPercentage: { $min: "$overallStats.percentage" },
          maxPercentage: { $max: "$overallStats.percentage" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalSubmissions,
        statusBreakdown: statusCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        reviewStatus: {
          reviewed: reviewedCount,
          pending: totalSubmissions - reviewedCount,
          flagged: flaggedCount,
        },
        confidenceStats: confidenceStats[0] || {
          avgConfidence: 0,
          minConfidence: 0,
          maxConfidence: 0,
        },
        scoreStats: scoreStats[0] || {
          avgPercentage: 0,
          minPercentage: 0,
          maxPercentage: 0,
        },
      },
    });
  } catch (error) {
    console.error("Get review statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching review statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Export review data for a class or assessment
 * @route   GET /api/review/export
 * @access  Private
 */
exports.exportReviewData = async (req, res) => {
  try {
    const { classId, assessmentId, format = "json" } = req.query;

    if (!classId && !assessmentId) {
      return res.status(400).json({
        success: false,
        message: "Either classId or assessmentId is required",
      });
    }

    const filter = {};
    if (classId) filter.classId = classId;
    if (assessmentId) filter.assessmentId = assessmentId;

    const submissions = await StudentAnswer.find(filter)
      .populate("studentId", "name studentId email")
      .populate("assessmentId", "title activityType")
      .populate("classId", "className grade subject")
      .populate("teacherReview.reviewedBy", "name email")
      .lean();

    // Transform data for export
    const exportData = submissions.map((submission) => ({
      submissionId: submission._id,
      student: {
        name: submission.studentId?.name,
        studentId: submission.studentId?.studentId,
        email: submission.studentId?.email,
      },
      assessment: {
        title: submission.assessmentId?.title,
        type: submission.assessmentId?.activityType,
      },
      class: {
        name: submission.classId?.className,
        grade: submission.classId?.grade,
        subject: submission.classId?.subject,
      },
      submittedAt: submission.submittedAt,
      processingStatus: submission.processingStatus,
      overallStats: submission.overallStats,
      review: {
        reviewed: submission.teacherReview?.reviewed || false,
        reviewedBy: submission.teacherReview?.reviewedBy?.name,
        reviewedAt: submission.teacherReview?.reviewedAt,
        comments: submission.teacherReview?.comments,
        flaggedForRegrade: submission.teacherReview?.flaggedForRegrade || false,
      },
      answers: submission.answers.map((a) => ({
        questionNumber: a.questionNumber,
        status: a.status,
        ocrConfidence: a.ocrData?.confidence || 0,
        extractedText: a.ocrData?.extractedText || "",
        editedText: a.editedText || "",
        isEdited: a.isEdited,
        score: a.grading?.finalScore || a.grading?.aiScore?.score || 0,
        maxScore: a.grading?.aiScore?.maxScore || 0,
        isManuallyAdjusted: a.grading?.isManuallyAdjusted || false,
      })),
    }));

    if (format === "csv") {
      // Convert to CSV format
      // This is a simplified version - you might want to use a library like 'json2csv'
      const csv = convertToCSV(exportData);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=review-export-${Date.now()}.csv`
      );
      return res.send(csv);
    }

    // Default JSON format
    res.status(200).json({
      success: true,
      count: exportData.length,
      data: exportData,
    });
  } catch (error) {
    console.error("Export review data error:", error);
    res.status(500).json({
      success: false,
      message: "Error exporting review data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Helper function to convert JSON to CSV
 */
const convertToCSV = (data) => {
  if (!data || data.length === 0) return "";

  const headers = [
    "Student Name",
    "Student ID",
    "Assessment",
    "Class",
    "Total Score",
    "Percentage",
    "Status",
    "Reviewed",
    "Flagged",
  ];

  const rows = data.map((item) => [
    item.student.name,
    item.student.studentId,
    item.assessment.title,
    item.class.name,
    `${item.overallStats.totalScore}/${item.overallStats.maxPossibleScore}`,
    `${item.overallStats.percentage.toFixed(2)}%`,
    item.processingStatus,
    item.review.reviewed ? "Yes" : "No",
    item.review.flaggedForRegrade ? "Yes" : "No",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csvContent;
};
