// backend/controller/answerSubmissionController.js
const StudentAnswer = require("../model/StudentAnswer");
const Assessment = require("../model/Assessment");
const Student = require("../model/Student");
const LessonPlan = require("../model/Lesson");

/**
 * @desc    Submit a new answer with image(s)
 * @route   POST /api/answers/submit
 * @access  Private
 */
exports.submitAnswer = async (req, res) => {
  try {
    const {
      assessmentId,
      lessonPlanId,
      classId,
      studentId,
      submissionMethod,
      answers, // Array of { questionNumber, originalImage } - for individual mode
      files, // Array of { fileName, fileType, fileData, fileIndex } - for bulk mode
    } = req.body;

    // Validate required fields
    if (!assessmentId || !classId || !studentId) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: assessmentId, classId, studentId",
      });
    }

    // Check if either answers or files are provided
    if (
      (!answers || !Array.isArray(answers) || answers.length === 0) &&
      (!files || !Array.isArray(files) || files.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one answer or file is required",
      });
    }

    // Verify assessment exists
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check for duplicate submission
    const existingSubmission = await StudentAnswer.findOne({
      assessmentId,
      studentId,
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: "Student has already submitted answers for this assessment",
        existingSubmissionId: existingSubmission._id,
      });
    }

    // Format answers for database
    let formattedAnswers;
    let totalItems;

    if (submissionMethod === "upload_bulk" && files) {
      // Handle bulk upload mode - store files as answers
      formattedAnswers = files.map((file) => ({
        questionNumber: file.fileIndex,
        questionText: file.fileName,
        originalImage: file.fileData,
        uploadedAt: new Date(),
        ocrData: {
          extractedText: "",
          confidence: 0,
          metadata: {
            fileName: file.fileName,
            fileType: file.fileType,
            isPdf: file.fileType === "application/pdf",
          },
          processedAt: null,
        },
        grading: {},
        status: "pending_ocr",
      }));
      totalItems = files.length;
    } else {
      // Handle individual upload mode
      formattedAnswers = answers.map((answer) => ({
        questionNumber: answer.questionNumber,
        questionText: answer.questionText || "",
        originalImage: answer.originalImage || "",
        uploadedAt: new Date(),
        ocrData: {
          extractedText: "",
          confidence: 0,
          metadata: {},
          processedAt: null,
        },
        grading: {},
        status: "pending_ocr",
      }));
      totalItems = answers.length;
    }

    // Create student answer document
    const studentAnswer = await StudentAnswer.create({
      assessmentId,
      lessonPlanId,
      classId,
      studentId,
      submissionMethod: submissionMethod || "upload_image",
      submittedAt: new Date(),
      answers: formattedAnswers,
      overallStats: {
        totalQuestions: totalItems,
        questionsAttempted: 0,
        totalScore: 0,
        maxPossibleScore: 0,
        percentage: 0,
        averageConfidence: 0,
        processingTime: 0,
      },
      processingStatus: "pending",
    });

    // Populate and return
    await studentAnswer.populate([
      { path: "studentId", select: "name studentId" },
      { path: "assessmentId", select: "title activityType" },
      { path: "classId", select: "className grade" },
    ]);

    res.status(201).json({
      success: true,
      message: "Answer submitted successfully",
      data: studentAnswer,
      submissionId: studentAnswer._id,
    });
  } catch (error) {
    console.error("Submit answer error:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting answer",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Batch submit multiple student answers
 * @route   POST /api/answers/batch-submit
 * @access  Private
 */
exports.batchSubmitAnswers = async (req, res) => {
  try {
    const { submissions } = req.body;

    if (
      !submissions ||
      !Array.isArray(submissions) ||
      submissions.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Submissions array is required",
      });
    }

    const results = {
      successful: [],
      failed: [],
      duplicates: [],
    };

    // Process each submission
    for (const submission of submissions) {
      try {
        const {
          assessmentId,
          lessonPlanId,
          classId,
          studentId,
          submissionMethod,
          answers,
        } = submission;

        // Validate required fields
        if (
          !assessmentId ||
          !lessonPlanId ||
          !classId ||
          !studentId ||
          !answers
        ) {
          results.failed.push({
            submission,
            reason: "Missing required fields",
          });
          continue;
        }

        // Check for duplicate
        const existing = await StudentAnswer.findOne({
          assessmentId,
          studentId,
        });

        if (existing) {
          results.duplicates.push({
            submission,
            reason: "Student already submitted for this assessment",
            existingId: existing._id,
          });
          continue;
        }

        // Format answers
        const formattedAnswers = answers.map((answer) => ({
          questionNumber: answer.questionNumber,
          questionText: answer.questionText || "",
          originalImage: answer.originalImage || "",
          uploadedAt: new Date(),
          ocrData: {
            extractedText: "",
            confidence: 0,
            metadata: {},
            processedAt: null,
          },
          grading: {},
          status: "pending_ocr",
        }));

        // Create submission
        const studentAnswer = await StudentAnswer.create({
          assessmentId,
          lessonPlanId,
          classId,
          studentId,
          submissionMethod: submissionMethod || "upload_image",
          submittedAt: new Date(),
          answers: formattedAnswers,
          overallStats: {
            totalQuestions: answers.length,
            questionsAttempted: 0,
            totalScore: 0,
            maxPossibleScore: 0,
            percentage: 0,
            averageConfidence: 0,
            processingTime: 0,
          },
          processingStatus: "pending",
        });

        await studentAnswer.populate([
          { path: "studentId", select: "name studentId" },
          { path: "assessmentId", select: "title" },
        ]);

        results.successful.push(studentAnswer);
      } catch (err) {
        results.failed.push({
          submission,
          reason: err.message,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Submitted ${results.successful.length} of ${submissions.length} answers`,
      data: results,
    });
  } catch (error) {
    console.error("Batch submit error:", error);
    res.status(500).json({
      success: false,
      message: "Error batch submitting answers",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get submission by ID
 * @route   GET /api/answers/:id
 * @access  Private
 */
exports.getSubmissionById = async (req, res) => {
  try {
    const submission = await StudentAnswer.findById(req.params.id)
      .populate("studentId", "name studentId avatar")
      .populate("assessmentId", "title activityType questionCount")
      .populate("classId", "className grade subject")
      .populate("lessonPlanId", "parameters.specificTopic");

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    res.status(200).json({
      success: true,
      data: submission,
    });
  } catch (error) {
    console.error("Get submission error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching submission",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get all submissions for an assessment
 * @route   GET /api/answers/assessment/:assessmentId
 * @access  Private
 */
exports.getSubmissionsByAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { status, sortBy = "submittedAt", sortOrder = "desc" } = req.query;

    const query = { assessmentId };

    if (status) {
      query.processingStatus = status;
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const submissions = await StudentAnswer.find(query)
      .populate("studentId", "name studentId avatar")
      .populate("classId", "className grade")
      .sort(sort);

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    console.error("Get submissions by assessment error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching submissions",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get all submissions for a class
 * @route   GET /api/answers/class/:classId
 * @access  Private
 */
exports.getSubmissionsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { assessmentId, status } = req.query;

    // Build query object
    const query = {};

    // Handle special "all" case - fetch all user's submissions
    if (classId !== "all") {
      query.classId = classId;
    }

    // Add optional filters
    if (assessmentId) {
      query.assessmentId = assessmentId;
    }

    if (status) {
      query.processingStatus = status;
    }

    const submissions = await StudentAnswer.find(query)
      .populate("studentId", "name studentId avatar")
      .populate("assessmentId", "title activityType")
      .populate("classId", "className grade")
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    console.error("Get submissions by class error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching submissions",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get assessment statistics with class information
 * @route   GET /api/answers/assessment/:assessmentId/stats
 * @access  Private
 */
exports.getAssessmentStats = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    // Get assessment with class info
    const assessment = await Assessment.findById(assessmentId).populate(
      "classId",
      "className grade subject students classStats"
    );

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }

    // Get all submissions for this assessment
    const submissions = await StudentAnswer.find({ assessmentId })
      .populate("studentId", "name studentId")
      .populate("classId", "className grade");

    // Calculate statistics
    const totalStudentsInClass =
      assessment.classId?.classStats?.totalStudents ||
      assessment.classId?.students?.length ||
      0;

    const totalSubmissions = submissions.length;

    // Calculate average score (only from completed submissions)
    const completedSubmissions = submissions.filter(
      (s) => s.processingStatus === "completed"
    );

    let overallAverage = 0;
    if (completedSubmissions.length > 0) {
      const totalPercentage = completedSubmissions.reduce(
        (sum, sub) => sum + (sub.overallStats?.percentage || 0),
        0
      );
      overallAverage = totalPercentage / completedSubmissions.length;
    }

    res.status(200).json({
      success: true,
      data: {
        assessment: {
          _id: assessment._id,
          title: assessment.title,
          activityType: assessment.activityType,
        },
        class: {
          _id: assessment.classId?._id,
          className: assessment.classId?.className,
          grade: assessment.classId?.grade,
          subject: assessment.classId?.subject,
          totalStudents: totalStudentsInClass,
        },
        statistics: {
          totalStudentsInClass,
          totalSubmissions,
          submissionRate:
            totalStudentsInClass > 0
              ? ((totalSubmissions / totalStudentsInClass) * 100).toFixed(1)
              : 0,
          overallAverage: overallAverage.toFixed(1),
          completedSubmissions: completedSubmissions.length,
          pendingSubmissions: submissions.length - completedSubmissions.length,
        },
        submissions,
      },
    });
  } catch (error) {
    console.error("Get assessment stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching assessment statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Delete a submission
 * @route   DELETE /api/answers/:id
 * @access  Private
 */
exports.deleteSubmission = async (req, res) => {
  try {
    const submission = await StudentAnswer.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    await submission.deleteOne();

    res.status(200).json({
      success: true,
      message: "Submission deleted successfully",
      data: {},
    });
  } catch (error) {
    console.error("Delete submission error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting submission",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
