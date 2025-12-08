// backend/controller/gradingController.js
const StudentAnswer = require("../model/StudentAnswer");
const Assessment = require("../model/Assessment");
const User = require("../model/User");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const {
  gradeSubmission,
  regradeAnswer,
  gradeSpmAnswerSheet,
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

    // Check if answer key exists (for MCQ/assessments) OR rubric (for essays)
    const hasAnswerKey = !!assessment.generatedContent?.answerKeyContent?.answers;
    const hasRubric = !!assessment.generatedContent?.rubricContent;

    if (!hasAnswerKey && !hasRubric) {
      return res.status(400).json({
        success: false,
        message: "Assessment does not have an answer key or rubric for grading",
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

/**
 * @desc    Process and Grade SPM Paper 1 Answer Sheet (Combined)
 * @route   POST /api/grading/process-and-grade-spm
 * @access  Private
 *
 * Answer Sheet Format:
 * - Questions 1-32: Multiple choice bubbles (A-H)
 * - Questions 33-40: Written answers on blank lines
 */
exports.processAndGradeSpmAnswerSheet = async (req, res) => {
  const startTime = Date.now();

  try {
    console.log("📝 Processing and Grading SPM Paper 1 Answer Sheet (32 MCQ + 8 Written)...");

    const { image, assessmentId, classId, studentId } = req.body;

    // Validate required fields
    if (!image || !assessmentId || !classId || !studentId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: image, assessmentId, classId, studentId",
      });
    }

    // Validate base64 format - accept both images and PDFs
    if (!image.startsWith("data:image/") && !image.startsWith("data:application/pdf")) {
      return res.status(400).json({
        success: false,
        message: "Invalid file format. Expected image or PDF base64 data URL.",
      });
    }

    // Get user with Gemini API key
    const user = await User.findById(req.user.id).select("+geminiApiKey");
    const geminiApiKey = user.getGeminiApiKey();

    if (!geminiApiKey) {
      return res.status(400).json({
        success: false,
        message: "No Gemini API key found.",
      });
    }

    // Get assessment with answer key
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }

    // Verify it's an SPM exam
    if (assessment.activityType !== "spm-exam") {
      return res.status(400).json({
        success: false,
        message: "This endpoint is only for SPM Paper 1 exams",
      });
    }

    // Get answer key
    const answerKey = assessment.generatedContent?.answerKeyContent?.answers || [];
    if (answerKey.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Assessment does not have an answer key",
      });
    }

    console.log("🔑 Using Gemini for bubble detection...");

    // Extract base64 data
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({
        success: false,
        message: "Invalid base64 image format",
      });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // Initialize Gemini for OCR
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Enhanced detection prompt based on the new SPM answer sheet template
    const prompt = `You are analyzing an SPM English Paper 1 answer sheet with 40 questions total.

CRITICAL - ANSWER SHEET LAYOUT:
The answer sheet is divided into TWO COLUMNS side by side:

**LEFT COLUMN (Questions 1-20):**
- Question numbers 1-20 on the left side
- Each question has 8 bubble circles labeled A, B, C, D, E, F, G, H
- Students fill ONE bubble per question

**RIGHT COLUMN (Questions 21-40):**
- **Questions 21-32 (MCQ Section):**
  - Question numbers 21-32 at the top of right column
  - Each has 8 bubble circles labeled A, B, C, D, E, F, G, H
  - Students fill ONE bubble per question

- **Questions 33-40 (Subjective Section):**
  - Located BELOW question 32 in the right column
  - Has a header: "Part 5: Write your answers (Questions 33-40)"
  - Each question (33-40) has a BLANK LINE next to the question number
  - Students write their answer as a WORD, PHRASE, or NUMBER on the line
  - NO BUBBLES for these questions

DETECTION INSTRUCTIONS:

**For Questions 1-32 (Multiple Choice):**
1. Look at the 8 bubble circles (A-H) next to each question number
2. Identify which bubble is filled/darkened (should be filled with pencil/pen)
3. Return ONLY the letter (A-H) of the filled bubble
4. If NO bubble is filled → return "BLANK"
5. If MULTIPLE bubbles are filled → return "MULTIPLE"
6. Set answerType to "mcq"

**For Questions 33-40 (Written Answers):**
1. These are BELOW the MCQ section in the right column
2. Look for the horizontal line next to question numbers 33, 34, 35, 36, 37, 38, 39, 40
3. Extract the handwritten or printed text on that line
4. Return the exact word/phrase/number written (clean and trimmed)
5. If nothing is written → return "BLANK"
6. Set answerType to "written"
7. IGNORE any bubbles near these questions - they should not exist in the template

VISUAL DETECTION TIPS:
- Questions 1-20: Look in LEFT side of the page
- Questions 21-32: Look in RIGHT side TOP section (still has bubbles)
- Questions 33-40: Look in RIGHT side BOTTOM section (has blank lines, NO bubbles)
- Filled bubbles appear darkened/shaded compared to empty circles
- Written answers appear as handwritten or printed text on horizontal lines

CONFIDENCE SCORING:
- 0.95-1.0: Very clear bubble fill or text
- 0.80-0.94: Clearly visible but slight ambiguity
- 0.60-0.79: Somewhat visible but needs attention
- 0.40-0.59: Difficult to read, low confidence
- 0.0-0.39: Very unclear or ambiguous

Return a JSON object with this EXACT structure (no extra text, just valid JSON):
{
  "answers": [
    {"questionNumber": 1, "selectedAnswer": "A", "confidence": 0.95, "answerType": "mcq"},
    {"questionNumber": 2, "selectedAnswer": "B", "confidence": 0.90, "answerType": "mcq"},
    ...
    {"questionNumber": 20, "selectedAnswer": "D", "confidence": 0.88, "answerType": "mcq"},
    {"questionNumber": 21, "selectedAnswer": "C", "confidence": 0.92, "answerType": "mcq"},
    ...
    {"questionNumber": 32, "selectedAnswer": "F", "confidence": 0.89, "answerType": "mcq"},
    {"questionNumber": 33, "selectedAnswer": "photosynthesis", "confidence": 0.85, "answerType": "written"},
    {"questionNumber": 34, "selectedAnswer": "enzyme", "confidence": 0.90, "answerType": "written"},
    {"questionNumber": 35, "selectedAnswer": "mitochondria", "confidence": 0.87, "answerType": "written"},
    {"questionNumber": 36, "selectedAnswer": "glucose", "confidence": 0.92, "answerType": "written"},
    {"questionNumber": 37, "selectedAnswer": "cell membrane", "confidence": 0.88, "answerType": "written"},
    {"questionNumber": 38, "selectedAnswer": "BLANK", "confidence": 0.60, "answerType": "written"},
    {"questionNumber": 39, "selectedAnswer": "nucleus", "confidence": 0.91, "answerType": "written"},
    {"questionNumber": 40, "selectedAnswer": "chloroplast", "confidence": 0.89, "answerType": "written"}
  ],
  "overallConfidence": 0.89,
  "metadata": {
    "totalQuestions": 40,
    "mcqQuestions": 32,
    "writtenQuestions": 8,
    "answeredQuestions": 38,
    "blankQuestions": 2,
    "ambiguousQuestions": 0,
    "detectionNotes": "Any relevant observations about the answer sheet quality, alignment, or issues"
  }
}

CRITICAL REQUIREMENTS:
✓ Return ALL 40 questions in order (1-40)
✓ Questions 1-32: answerType MUST be "mcq"
✓ Questions 33-40: answerType MUST be "written"
✓ Confidence must be between 0.0 and 1.0
✓ For written answers, return the actual text (not "A", "B", etc.)
✓ For MCQ, return only single letter A-H
✓ Use "BLANK" for unanswered questions
✓ Use "MULTIPLE" only for Q1-32 if multiple bubbles filled
✓ Clean and trim all text responses
✓ No markdown formatting in the JSON output`;

    // Call Gemini Vision API
    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType, data: base64Data } },
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse OCR response
    let detectionResult;
    try {
      const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      detectionResult = JSON.parse(cleanedText);

      if (!detectionResult.answers || detectionResult.answers.length !== 40) {
        throw new Error(`Expected 40 answers, got ${detectionResult.answers?.length || 0}`);
      }
    } catch (parseError) {
      console.error("❌ Failed to parse detection results:", parseError);
      return res.status(500).json({
        success: false,
        message: "Failed to parse answer sheet detection results",
        error: parseError.message,
      });
    }

    console.log(`✅ Detected ${detectionResult.metadata?.answeredQuestions || 0}/40 answers`);
    console.log("🎯 Now grading answers...");

    // Grade the detected answers
    const gradingResults = gradeSpmAnswerSheet(detectionResult.answers, answerKey);

    // Create submission record
    const submission = new StudentAnswer({
      assessmentId,
      lessonPlanId: assessment.lessonPlanId,
      classId,
      studentId,
      submissionMethod: "upload_image",
      processingStatus: "completed",
      answerSheetImage: image, // Store image once for entire sheet
      answers: detectionResult.answers.map((detected, index) => {
        const gradingResult = gradingResults.results[index];
        return {
          questionNumber: detected.questionNumber,
          questionText: `Question ${detected.questionNumber}`,
          // originalImage removed - use answerSheetImage at document level
          ocrData: {
            extractedText: detected.selectedAnswer,
            confidence: detected.confidence,
            metadata: {
              detectionMethod: "bubble_detection",
              model: "gemini-2.5-flash",
              answerType: detected.answerType, // Store answer type (mcq/written)
            },
            processedAt: new Date(),
          },
          grading: {
            aiScore: {
              score: gradingResult.score,
              maxScore: gradingResult.maxScore,
              percentage: gradingResult.isCorrect ? 100 : 0,
              feedback: gradingResult.feedback,
              reasoning: gradingResult.feedback,
              scoredAt: new Date(),
            },
            finalScore: gradingResult.score,
            isManuallyAdjusted: false,
          },
          status: "graded",
        };
      }),
      overallStats: {
        totalQuestions: gradingResults.summary.totalQuestions,
        questionsAttempted: gradingResults.summary.correctAnswers + gradingResults.summary.incorrectAnswers,
        totalScore: gradingResults.summary.totalScore,
        maxPossibleScore: gradingResults.summary.maxPossibleScore,
        percentage: parseFloat(gradingResults.summary.percentage),
        averageConfidence: parseFloat(gradingResults.summary.averageConfidence),
        processingTime: (Date.now() - startTime) / 1000,
      },
    });

    await submission.save();

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ Processing and grading completed in ${processingTime}s`);
    console.log(`📊 Final Score: ${gradingResults.summary.totalScore}/${gradingResults.summary.maxPossibleScore} (${gradingResults.summary.percentage}%)`);

    res.status(200).json({
      success: true,
      message: "SPM answer sheet processed and graded successfully",
      data: {
        submissionId: submission._id,
        detectionResults: {
          answers: detectionResult.answers,
          metadata: detectionResult.metadata,
        },
        gradingResults: {
          results: gradingResults.results,
          summary: gradingResults.summary,
        },
        overallStats: submission.overallStats,
        processingTime: `${processingTime}s`,
      },
    });
  } catch (error) {
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ Process and grade error after ${processingTime}s:`, error);

    res.status(500).json({
      success: false,
      message: "Error processing and grading answer sheet",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      processingTime: `${processingTime}s`,
    });
  }
};
