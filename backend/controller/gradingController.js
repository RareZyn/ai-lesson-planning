// backend/controller/gradingController.js
const StudentAnswer = require("../model/StudentAnswer");
const Assessment = require("../model/Assessment");
const User = require("../model/User");
const {
  gradeSubmission,
  regradeAnswer,
} = require("../services/gradingService");

/**
 * @desc    Grade a complete submission
 * @route   POST /api/grading/score-submission/:submissionId
 * @access  Private
 */
exports.scoreSubmission = async (req, res) => {
  const startTime = Date.now();

  try {
    console.log("🎯 Starting submission grading...");

    const { submissionId } = req.params;

    // Find submission
    const submission = await StudentAnswer.findById(submissionId)
      .populate("assessmentId")
      .populate("studentId", "name studentId");

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    // Check if OCR is completed
    const hasUnprocessedOCR = submission.answers.some(
      (a) => a.status === "pending_ocr"
    );

    if (hasUnprocessedOCR) {
      return res.status(400).json({
        success: false,
        message: "OCR processing must be completed before grading",
      });
    }

    // Get user with API key
    const user = await User.findById(req.user.id).select("+geminiApiKey");
    const geminiApiKey = user.getGeminiApiKey();

    if (!geminiApiKey) {
      return res.status(400).json({
        success: false,
        message: "No Gemini API key found.",
      });
    }

    // Get assessment with answer key
    const assessment = await Assessment.findById(submission.assessmentId);
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }

    // Check if answer key exists
    if (!assessment.generatedContent?.answerKeyContent?.answers) {
      return res.status(400).json({
        success: false,
        message: "Assessment does not have an answer key",
      });
    }

    // Update processing status
    submission.processingStatus = "processing_grading";
    await submission.save();

    // Grade the submission
    const gradingResults = await gradeSubmission(
      submission,
      assessment,
      geminiApiKey
    );

    // Update processing status
    submission.processingStatus = "completed";
    await submission.save();

    // Update student performance stats
    if (submission.studentId && submission.studentId.updatePerformanceStats) {
      await submission.studentId.updatePerformanceStats();
    }

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ Grading completed in ${processingTime}s`);
    console.log(
      `📊 Score: ${gradingResults.summary.totalScore}/${gradingResults.summary.maxPossibleScore}`
    );

    res.status(200).json({
      success: true,
      message: "Submission graded successfully",
      data: {
        submissionId: submission._id,
        studentName: submission.studentId?.name,
        results: gradingResults.results,
        summary: {
          ...gradingResults.summary,
          processingTime: `${processingTime}s`,
        },
        overallStats: submission.overallStats,
      },
    });
  } catch (error) {
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ Grading error after ${processingTime}s:`, error);

    // Update submission with error
    if (req.params.submissionId) {
      try {
        await StudentAnswer.findByIdAndUpdate(req.params.submissionId, {
          processingStatus: "error",
          $push: {
            errors: {
              stage: "grading",
              message: error.message,
              timestamp: new Date(),
            },
          },
        });
      } catch (updateError) {
        console.error("Failed to update submission error:", updateError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Error grading submission",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      processingTime: `${processingTime}s`,
    });
  }
};

/**
 * @desc    Grade a single answer
 * @route   POST /api/grading/score-answer/:submissionId/:questionNumber
 * @access  Private
 */
exports.scoreAnswer = async (req, res) => {
  try {
    const { submissionId, questionNumber } = req.params;

    // Find submission
    const submission = await StudentAnswer.findById(submissionId).populate(
      "assessmentId"
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    // Find the specific answer
    const answer = submission.answers.find(
      (a) => a.questionNumber === parseInt(questionNumber)
    );

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: "Answer not found",
      });
    }

    // Check if OCR is completed for this answer
    if (answer.status === "pending_ocr") {
      return res.status(400).json({
        success: false,
        message: "OCR must be completed before grading",
      });
    }

    // Get user API key
    const user = await User.findById(req.user.id).select("+geminiApiKey");
    const geminiApiKey = user.getGeminiApiKey();

    if (!geminiApiKey) {
      return res.status(400).json({
        success: false,
        message: "No Gemini API key found.",
      });
    }

    // Get assessment answer key
    const assessment = await Assessment.findById(submission.assessmentId);
    const answerKey =
      assessment.generatedContent?.answerKeyContent?.answers || [];
    const keyAnswer = answerKey.find(
      (k) => k.questionNumber === parseInt(questionNumber)
    );

    if (!keyAnswer) {
      return res.status(404).json({
        success: false,
        message: "Answer key not found for this question",
      });
    }

    // Regrade the answer
    const gradingResult = await regradeAnswer(answer, keyAnswer, geminiApiKey);

    // Recalculate overall stats
    submission.calculateOverallStats();
    await submission.save();

    res.status(200).json({
      success: true,
      message: "Answer graded successfully",
      data: {
        questionNumber: answer.questionNumber,
        score: gradingResult.score,
        maxScore: gradingResult.maxScore,
        percentage: gradingResult.percentage,
        feedback: gradingResult.feedback,
        reasoning: gradingResult.reasoning,
      },
    });
  } catch (error) {
    console.error("Score answer error:", error);
    res.status(500).json({
      success: false,
      message: "Error grading answer",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Batch grade multiple submissions
 * @route   POST /api/grading/batch-grade
 * @access  Private
 */
exports.batchGradeSubmissions = async (req, res) => {
  const startTime = Date.now();

  try {
    const { submissionIds } = req.body;

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

    console.log(`🎯 Batch grading ${submissionIds.length} submissions...`);

    // Get user API key
    const user = await User.findById(req.user.id).select("+geminiApiKey");
    const geminiApiKey = user.getGeminiApiKey();

    if (!geminiApiKey) {
      return res.status(400).json({
        success: false,
        message: "No Gemini API key found.",
      });
    }

    const results = {
      successful: [],
      failed: [],
    };

    // Process each submission
    for (let i = 0; i < submissionIds.length; i++) {
      const submissionId = submissionIds[i];
      console.log(
        `\n🎯 Grading submission ${i + 1}/${submissionIds.length}...`
      );

      try {
        const submission = await StudentAnswer.findById(submissionId)
          .populate("assessmentId")
          .populate("studentId", "name studentId");

        if (!submission) {
          results.failed.push({
            submissionId,
            reason: "Submission not found",
          });
          continue;
        }

        // Check OCR status
        const hasUnprocessedOCR = submission.answers.some(
          (a) => a.status === "pending_ocr"
        );

        if (hasUnprocessedOCR) {
          results.failed.push({
            submissionId,
            reason: "OCR not completed",
          });
          continue;
        }

        // Get assessment
        const assessment = await Assessment.findById(submission.assessmentId);
        if (
          !assessment ||
          !assessment.generatedContent?.answerKeyContent?.answers
        ) {
          results.failed.push({
            submissionId,
            reason: "Assessment or answer key not found",
          });
          continue;
        }

        // Update status
        submission.processingStatus = "processing_grading";
        await submission.save();

        // Grade submission
        const gradingResults = await gradeSubmission(
          submission,
          assessment,
          geminiApiKey
        );

        submission.processingStatus = "completed";
        await submission.save();

        // Update student performance
        if (
          submission.studentId &&
          submission.studentId.updatePerformanceStats
        ) {
          await submission.studentId.updatePerformanceStats();
        }

        results.successful.push({
          submissionId,
          studentName: submission.studentId?.name,
          score: gradingResults.summary.totalScore,
          maxScore: gradingResults.summary.maxPossibleScore,
          percentage: gradingResults.summary.percentage,
        });

        // Delay between submissions
        if (i < submissionIds.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (submissionError) {
        console.error(
          `Error grading submission ${submissionId}:`,
          submissionError
        );
        results.failed.push({
          submissionId,
          reason: submissionError.message,
        });
      }
    }

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n✅ Batch grading completed in ${processingTime}s`);

    res.status(200).json({
      success: true,
      message: `Graded ${results.successful.length} of ${submissionIds.length} submissions`,
      data: results,
      summary: {
        total: submissionIds.length,
        successful: results.successful.length,
        failed: results.failed.length,
        processingTime: `${processingTime}s`,
      },
    });
  } catch (error) {
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ Batch grading error after ${processingTime}s:`, error);

    res.status(500).json({
      success: false,
      message: "Error in batch grading",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      processingTime: `${processingTime}s`,
    });
  }
};

/**
 * @desc    Get grading status for a submission
 * @route   GET /api/grading/status/:submissionId
 * @access  Private
 */
exports.getGradingStatus = async (req, res) => {
  try {
    const submission = await StudentAnswer.findById(req.params.submissionId)
      .select(
        "processingStatus overallStats answers.questionNumber answers.status answers.grading.aiScore"
      )
      .lean();

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    const questionStatus = submission.answers.map((a) => ({
      questionNumber: a.questionNumber,
      status: a.status,
      score: a.grading?.aiScore?.score || null,
      maxScore: a.grading?.aiScore?.maxScore || null,
      isGraded: a.status === "graded" || a.status === "reviewed",
    }));

    res.status(200).json({
      success: true,
      data: {
        submissionId: submission._id,
        processingStatus: submission.processingStatus,
        overallStats: submission.overallStats,
        questionStatus,
        gradingComplete: submission.processingStatus === "completed",
      },
    });
  } catch (error) {
    console.error("Get grading status error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching grading status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
