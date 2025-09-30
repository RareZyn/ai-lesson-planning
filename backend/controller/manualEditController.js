// backend/controller/manualEditController.js - COMPLETE VERSION
const StudentAnswer = require("../model/StudentAnswer");
const Assessment = require("../model/Assessment");
const User = require("../model/User");
const { regradeAnswer } = require("../services/gradingService");

/**
 * @desc    Edit extracted text for a specific answer
 * @route   PUT /api/manual-edit/:submissionId/edit-text/:questionNumber
 * @access  Private
 */
exports.editExtractedText = async (req, res) => {
  try {
    const { submissionId, questionNumber } = req.params;
    const { editedText, autoRegrade = true } = req.body;

    if (!editedText || editedText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Edited text is required",
      });
    }

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

    // Update edited text
    answer.editedText = editedText.trim();
    answer.isEdited = true;
    answer.editedBy = req.user.id;
    answer.editedAt = new Date();

    // If auto-regrade is enabled and answer was already graded
    if (autoRegrade && answer.status === "graded") {
      try {
        // Get user API key for regrading
        const user = await User.findById(req.user.id).select("+geminiApiKey");
        const geminiApiKey = user.getGeminiApiKey();

        if (geminiApiKey) {
          // Get assessment answer key
          const assessment = await Assessment.findById(submission.assessmentId);
          const answerKey =
            assessment.generatedContent?.answerKeyContent?.answers || [];
          const keyAnswer = answerKey.find(
            (k) => k.questionNumber === parseInt(questionNumber)
          );

          if (keyAnswer) {
            console.log(
              `🔄 Auto-regrading question ${questionNumber} after text edit...`
            );

            // Regrade with edited text
            const gradingResult = await regradeAnswer(
              answer,
              keyAnswer,
              geminiApiKey
            );

            // Mark that grading was affected by manual edit
            answer.grading.isManuallyAdjusted = false; // Reset since we re-graded
            answer.grading.adjustedBy = null;
            answer.grading.adjustedAt = null;
            answer.grading.adjustmentReason = "Re-graded after text edit";

            console.log(
              `✅ Question ${questionNumber} re-graded: ${gradingResult.score}/${gradingResult.maxScore}`
            );
          }
        }
      } catch (regradeError) {
        console.error("Auto-regrade error:", regradeError);
        // Continue even if regrade fails - the text edit is still saved
      }
    }

    // Recalculate overall stats if needed
    if (answer.status === "graded") {
      submission.calculateOverallStats();
    }

    await submission.save();

    res.status(200).json({
      success: true,
      message: autoRegrade
        ? "Text edited and answer re-graded successfully"
        : "Text edited successfully",
      data: {
        questionNumber: answer.questionNumber,
        editedText: answer.editedText,
        isEdited: answer.isEdited,
        editedBy: answer.editedBy,
        editedAt: answer.editedAt,
        wasRegraded: autoRegrade && answer.status === "graded",
        newScore: answer.grading?.aiScore?.score || null,
      },
    });
  } catch (error) {
    console.error("Edit text error:", error);
    res.status(500).json({
      success: false,
      message: "Error editing text",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Manually adjust score for a specific answer
 * @route   PUT /api/manual-edit/:submissionId/adjust-score/:questionNumber
 * @access  Private
 */
exports.adjustScore = async (req, res) => {
  try {
    const { submissionId, questionNumber } = req.params;
    const { newScore, adjustmentReason } = req.body;

    if (newScore === undefined || newScore === null) {
      return res.status(400).json({
        success: false,
        message: "New score is required",
      });
    }

    // Find submission
    const submission = await StudentAnswer.findById(submissionId);

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

    // Check if answer has been graded
    if (!answer.grading || !answer.grading.aiScore) {
      return res.status(400).json({
        success: false,
        message: "Answer must be graded before score adjustment",
      });
    }

    // Validate score range
    const maxScore = answer.grading.aiScore.maxScore;
    if (newScore < 0 || newScore > maxScore) {
      return res.status(400).json({
        success: false,
        message: `Score must be between 0 and ${maxScore}`,
      });
    }

    // Store original AI score for reference
    const originalScore = answer.grading.aiScore.score;

    // Update score
    answer.grading.finalScore = newScore;
    answer.grading.isManuallyAdjusted = true;
    answer.grading.adjustedBy = req.user.id;
    answer.grading.adjustedAt = new Date();
    answer.grading.adjustmentReason =
      adjustmentReason || "Manual adjustment by teacher";

    // Recalculate overall stats
    submission.calculateOverallStats();
    await submission.save();

    console.log(
      `📝 Score adjusted for Q${questionNumber}: ${originalScore} → ${newScore}`
    );

    res.status(200).json({
      success: true,
      message: "Score adjusted successfully",
      data: {
        questionNumber: answer.questionNumber,
        originalScore,
        newScore,
        maxScore,
        adjustedBy: answer.grading.adjustedBy,
        adjustedAt: answer.grading.adjustedAt,
        adjustmentReason: answer.grading.adjustmentReason,
        overallStats: submission.overallStats,
      },
    });
  } catch (error) {
    console.error("Adjust score error:", error);
    res.status(500).json({
      success: false,
      message: "Error adjusting score",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Bulk edit multiple answers in a submission
 * @route   PUT /api/manual-edit/:submissionId/bulk-edit
 * @access  Private
 */
exports.bulkEditAnswers = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { edits } = req.body; // Array of { questionNumber, editedText, newScore }

    if (!edits || !Array.isArray(edits) || edits.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Edits array is required",
      });
    }

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

    const results = {
      successful: [],
      failed: [],
    };

    // Get user API key for potential regrading
    const user = await User.findById(req.user.id).select("+geminiApiKey");
    const geminiApiKey = user.getGeminiApiKey();
    const assessment = await Assessment.findById(submission.assessmentId);
    const answerKey =
      assessment?.generatedContent?.answerKeyContent?.answers || [];

    // Process each edit
    for (const edit of edits) {
      try {
        const { questionNumber, editedText, newScore } = edit;

        const answer = submission.answers.find(
          (a) => a.questionNumber === parseInt(questionNumber)
        );

        if (!answer) {
          results.failed.push({
            questionNumber,
            reason: "Answer not found",
          });
          continue;
        }

        let wasRegraded = false;

        // Edit text if provided
        if (editedText !== undefined && editedText !== null) {
          answer.editedText = editedText.trim();
          answer.isEdited = true;
          answer.editedBy = req.user.id;
          answer.editedAt = new Date();

          // Auto-regrade if possible
          if (geminiApiKey && answer.status === "graded") {
            const keyAnswer = answerKey.find(
              (k) => k.questionNumber === parseInt(questionNumber)
            );
            if (keyAnswer) {
              try {
                await regradeAnswer(answer, keyAnswer, geminiApiKey);
                wasRegraded = true;
              } catch (regradeError) {
                console.error(
                  `Regrade error for Q${questionNumber}:`,
                  regradeError
                );
              }
            }
          }
        }

        // Adjust score if provided (overrides regrade)
        if (
          newScore !== undefined &&
          newScore !== null &&
          answer.grading?.aiScore
        ) {
          const maxScore = answer.grading.aiScore.maxScore;
          if (newScore >= 0 && newScore <= maxScore) {
            answer.grading.finalScore = newScore;
            answer.grading.isManuallyAdjusted = true;
            answer.grading.adjustedBy = req.user.id;
            answer.grading.adjustedAt = new Date();
            answer.grading.adjustmentReason = "Bulk edit adjustment";
          }
        }

        results.successful.push({
          questionNumber,
          textEdited: editedText !== undefined,
          scoreAdjusted: newScore !== undefined,
          wasRegraded,
        });
      } catch (editError) {
        results.failed.push({
          questionNumber: edit.questionNumber,
          reason: editError.message,
        });
      }
    }

    // Recalculate overall stats
    submission.calculateOverallStats();
    await submission.save();

    res.status(200).json({
      success: true,
      message: `Processed ${results.successful.length} of ${edits.length} edits`,
      data: results,
      overallStats: submission.overallStats,
    });
  } catch (error) {
    console.error("Bulk edit error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing bulk edits",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Reset manual adjustments for an answer
 * @route   PUT /api/manual-edit/:submissionId/reset/:questionNumber
 * @access  Private
 */
exports.resetAdjustments = async (req, res) => {
  try {
    const { submissionId, questionNumber } = req.params;

    const submission = await StudentAnswer.findById(submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    const answer = submission.answers.find(
      (a) => a.questionNumber === parseInt(questionNumber)
    );

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: "Answer not found",
      });
    }

    // Reset to AI score
    if (answer.grading && answer.grading.aiScore) {
      answer.grading.finalScore = answer.grading.aiScore.score;
      answer.grading.isManuallyAdjusted = false;
      answer.grading.adjustedBy = null;
      answer.grading.adjustedAt = null;
      answer.grading.adjustmentReason = null;
    }

    // Reset text edits
    answer.isEdited = false;
    answer.editedText = null;
    answer.editedBy = null;
    answer.editedAt = null;

    // Recalculate overall stats
    submission.calculateOverallStats();
    await submission.save();

    res.status(200).json({
      success: true,
      message: "Adjustments reset successfully",
      data: {
        questionNumber: answer.questionNumber,
        currentScore: answer.grading?.finalScore || null,
        overallStats: submission.overallStats,
      },
    });
  } catch (error) {
    console.error("Reset adjustments error:", error);
    res.status(500).json({
      success: false,
      message: "Error resetting adjustments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get edit history for a submission
 * @route   GET /api/manual-edit/:submissionId/edit-history
 * @access  Private
 */
exports.getEditHistory = async (req, res) => {
  try {
    const submission = await StudentAnswer.findById(req.params.submissionId)
      .populate("answers.editedBy", "name email")
      .populate("answers.grading.adjustedBy", "name email")
      .lean();

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    const editHistory = submission.answers
      .filter((a) => a.isEdited || a.grading?.isManuallyAdjusted)
      .map((a) => ({
        questionNumber: a.questionNumber,
        textEdited: a.isEdited,
        editedBy: a.editedBy,
        editedAt: a.editedAt,
        originalText: a.ocrData?.extractedText || "",
        editedText: a.editedText || "",
        scoreAdjusted: a.grading?.isManuallyAdjusted || false,
        aiScore: a.grading?.aiScore?.score || null,
        finalScore: a.grading?.finalScore || null,
        adjustedBy: a.grading?.adjustedBy,
        adjustedAt: a.grading?.adjustedAt,
        adjustmentReason: a.grading?.adjustmentReason || "",
      }));

    res.status(200).json({
      success: true,
      data: {
        submissionId: submission._id,
        totalEdits: editHistory.length,
        editHistory,
      },
    });
  } catch (error) {
    console.error("Get edit history error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching edit history",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
