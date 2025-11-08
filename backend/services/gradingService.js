// backend/services/gradingService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Grade a single answer using AI semantic comparison
 */
const gradeAnswer = async (gradingData) => {
  const {
    questionText,
    studentAnswer,
    correctAnswer,
    rubric,
    maxScore,
    geminiApiKey,
    questionType = "subjective",
  } = gradingData;

  try {
    // For objective questions (MCQ, True/False), use direct comparison
    if (questionType === "multiple_choice" || questionType === "true_false") {
      return gradeObjectiveQuestion(studentAnswer, correctAnswer, maxScore);
    }

    // For subjective questions, use AI grading
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = buildGradingPrompt(
      questionText,
      studentAnswer,
      correctAnswer,
      rubric,
      maxScore
    );

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse AI response
    let gradingResult;
    try {
      const cleanedText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      gradingResult = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse grading response:", parseError);
      throw new Error("Invalid grading response format");
    }

    // Validate and format result
    return {
      score: Math.min(Math.max(0, gradingResult.score || 0), maxScore),
      maxScore: maxScore,
      percentage: ((gradingResult.score || 0) / maxScore) * 100,
      feedback: gradingResult.feedback || "No feedback provided",
      reasoning: gradingResult.reasoning || "",
      comparisonMetadata: {
        semanticSimilarity: gradingResult.semanticSimilarity || 0,
        keyPointsMatched: gradingResult.keyPointsMatched || [],
        keyPointsMissed: gradingResult.keyPointsMissed || [],
      },
      scoredAt: new Date(),
    };
  } catch (error) {
    console.error("Grading error:", error);
    throw error;
  }
};

/**
 * Grade objective questions (MCQ, True/False)
 */
const gradeObjectiveQuestion = (studentAnswer, correctAnswer, maxScore) => {
  const isCorrect =
    normalizeAnswer(studentAnswer) === normalizeAnswer(correctAnswer);

  return {
    score: isCorrect ? maxScore : 0,
    maxScore: maxScore,
    percentage: isCorrect ? 100 : 0,
    feedback: isCorrect
      ? "Correct answer!"
      : `Incorrect. The correct answer is: ${correctAnswer}`,
    reasoning: isCorrect
      ? "Student answer matches the correct answer exactly."
      : "Student answer does not match the correct answer.",
    comparisonMetadata: {
      semanticSimilarity: isCorrect ? 1.0 : 0.0,
      keyPointsMatched: isCorrect ? [correctAnswer] : [],
      keyPointsMissed: isCorrect ? [] : [correctAnswer],
    },
    scoredAt: new Date(),
  };
};

/**
 * Normalize answer for comparison (remove extra spaces, punctuation, case)
 */
const normalizeAnswer = (answer) => {
  if (!answer) return "";
  return answer
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
};

/**
 * Build grading prompt for AI
 */
const buildGradingPrompt = (
  questionText,
  studentAnswer,
  correctAnswer,
  rubric,
  maxScore
) => {
  return `You are an expert teacher grading student answers. Grade the following student answer based on the rubric and correct answer provided.

**Question:**
${questionText}

**Correct/Model Answer:**
${correctAnswer}

**Student's Answer:**
${studentAnswer}

**Rubric/Marking Criteria:**
${
  rubric ||
  "Standard marking scheme: Award full marks for complete and accurate answers, partial marks for partially correct answers."
}

**Maximum Score:** ${maxScore} points

**Instructions:**
1. Compare the student's answer semantically with the correct answer
2. Award marks based on:
   - Accuracy of content (key concepts covered)
   - Completeness (all required points addressed)
   - Understanding demonstrated
   - Clarity of explanation
3. Be fair and consider alternative valid explanations
4. Provide constructive feedback

**Return your grading in this JSON format:**
{
  "score": <number between 0 and ${maxScore}>,
  "feedback": "Detailed feedback explaining the score",
  "reasoning": "Why this score was given - what was correct/incorrect",
  "semanticSimilarity": <number between 0 and 1 indicating how close the answer is>,
  "keyPointsMatched": ["point 1", "point 2"],
  "keyPointsMissed": ["missing point 1", "missing point 2"]
}

Be fair, objective, and educational in your feedback.`;
};

/**
 * Grade multiple answers in a submission
 */
const gradeSubmission = async (submission, assessment, geminiApiKey) => {
  const results = [];
  let totalScore = 0;
  let maxPossibleScore = 0;

  // Get answer key from assessment
  const answerKey =
    assessment.generatedContent?.answerKeyContent?.answers || [];

  for (const answer of submission.answers) {
    try {
      // Skip if no OCR text extracted
      if (!answer.ocrData || !answer.ocrData.extractedText) {
        results.push({
          questionNumber: answer.questionNumber,
          success: false,
          error: "No text extracted from image",
        });
        continue;
      }

      // Find corresponding answer key
      const keyAnswer = answerKey.find(
        (key) => key.questionNumber === answer.questionNumber
      );

      if (!keyAnswer) {
        results.push({
          questionNumber: answer.questionNumber,
          success: false,
          error: "No answer key found for this question",
        });
        continue;
      }

      // Use edited text if available, otherwise use OCR text
      const studentAnswerText =
        answer.isEdited && answer.editedText
          ? answer.editedText
          : answer.ocrData.extractedText;

      // Determine question type
      const questionType = determineQuestionType(keyAnswer);

      // Grade the answer
      const gradingResult = await gradeAnswer({
        questionText:
          answer.questionText || `Question ${answer.questionNumber}`,
        studentAnswer: studentAnswerText,
        correctAnswer: keyAnswer.correctAnswer,
        rubric: keyAnswer.markingGuidance || keyAnswer.markingNotes || "",
        maxScore: keyAnswer.points || keyAnswer.marks || 1,
        geminiApiKey,
        questionType,
      });

      // Update answer with grading results
      answer.grading = {
        rubricUsed: null, // Can be linked to a Rubric model if needed
        aiScore: gradingResult,
        finalScore: gradingResult.score,
        isManuallyAdjusted: false,
        comparisonMetadata: gradingResult.comparisonMetadata,
      };

      answer.status = "graded";

      totalScore += gradingResult.score;
      maxPossibleScore += gradingResult.maxScore;

      results.push({
        questionNumber: answer.questionNumber,
        success: true,
        score: gradingResult.score,
        maxScore: gradingResult.maxScore,
        feedback: gradingResult.feedback,
      });

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error grading question ${answer.questionNumber}:`, error);

      results.push({
        questionNumber: answer.questionNumber,
        success: false,
        error: error.message,
      });

      // Add error to submission
      submission.processingErrors.push({
        stage: "grading",
        questionNumber: answer.questionNumber,
        message: error.message,
        timestamp: new Date(),
      });
    }
  }

  // Update overall stats
  submission.overallStats.totalScore = totalScore;
  submission.overallStats.maxPossibleScore = maxPossibleScore;
  submission.overallStats.percentage =
    maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

  return {
    results,
    summary: {
      totalScore,
      maxPossibleScore,
      percentage: submission.overallStats.percentage,
      questionsGraded: results.filter((r) => r.success).length,
      questionsFailed: results.filter((r) => !r.success).length,
    },
  };
};

/**
 * Determine question type from answer key
 */
const determineQuestionType = (answerKey) => {
  const answer = answerKey.correctAnswer?.toLowerCase() || "";

  // Check for MCQ patterns (A, B, C, D)
  if (/^[a-d]$/i.test(answer.trim())) {
    return "multiple_choice";
  }

  // Check for True/False
  if (answer === "true" || answer === "false") {
    return "true_false";
  }

  // Default to subjective
  return "subjective";
};

/**
 * Regrade a specific answer (after manual text edit)
 */
const regradeAnswer = async (answer, keyAnswer, geminiApiKey) => {
  const studentAnswerText =
    answer.isEdited && answer.editedText
      ? answer.editedText
      : answer.ocrData.extractedText;

  const questionType = determineQuestionType(keyAnswer);

  const gradingResult = await gradeAnswer({
    questionText: answer.questionText || `Question ${answer.questionNumber}`,
    studentAnswer: studentAnswerText,
    correctAnswer: keyAnswer.correctAnswer,
    rubric: keyAnswer.markingGuidance || keyAnswer.markingNotes || "",
    maxScore: keyAnswer.points || keyAnswer.marks || 1,
    geminiApiKey,
    questionType,
  });

  // Update answer with new grading
  answer.grading.aiScore = gradingResult;
  answer.grading.finalScore = gradingResult.score;
  answer.grading.comparisonMetadata = gradingResult.comparisonMetadata;
  answer.status = "graded";

  return gradingResult;
};

/**
 * Grade SPM Answer Sheet (Hybrid: 32 MCQ + 8 written answers)
 * NEW FORMAT:
 * - Questions 1-32: Multiple choice bubbles (A-H)
 * - Questions 33-40: Short written answers (Part 5: Information Transfer)
 *
 * @param {Array} detectedAnswers - Array of detected answers from OCR [{questionNumber, selectedAnswer, confidence, answerType}]
 * @param {Array} answerKey - Answer key from assessment
 * @returns {Object} Grading results with score breakdown
 */
const gradeSpmAnswerSheet = (detectedAnswers, answerKey) => {
  if (!detectedAnswers || !Array.isArray(detectedAnswers)) {
    throw new Error("Invalid detected answers format");
  }

  if (!answerKey || !Array.isArray(answerKey)) {
    throw new Error("Invalid answer key format");
  }

  const results = [];
  let totalScore = 0;
  let totalQuestions = 0;
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let blankAnswers = 0;
  let ambiguousAnswers = 0;
  let mcqCorrect = 0;
  let writtenCorrect = 0;

  // Process each detected answer
  detectedAnswers.forEach((detected) => {
    const questionNumber = detected.questionNumber;
    const studentAnswer = detected.selectedAnswer;
    const confidence = detected.confidence || 0;
    const answerType = detected.answerType || "mcq"; // Default to MCQ for backward compatibility

    // Find corresponding answer key
    const keyAnswer = answerKey.find((key) => key.questionNumber === questionNumber);

    if (!keyAnswer) {
      results.push({
        questionNumber,
        studentAnswer,
        correctAnswer: "N/A",
        isCorrect: false,
        score: 0,
        maxScore: 1,
        confidence,
        answerType,
        status: "no_answer_key",
        feedback: "No answer key found for this question",
      });
      return;
    }

    const correctAnswer = normalizeAnswer(keyAnswer.correctAnswer);
    const normalizedStudentAnswer = normalizeAnswer(studentAnswer);
    const maxScore = keyAnswer.points || keyAnswer.marks || 1;

    totalQuestions++;

    // Handle special cases
    if (studentAnswer === "BLANK" || !studentAnswer) {
      blankAnswers++;
      results.push({
        questionNumber,
        studentAnswer: "BLANK",
        correctAnswer: keyAnswer.correctAnswer,
        isCorrect: false,
        score: 0,
        maxScore,
        confidence,
        answerType,
        status: "blank",
        feedback: "Question was not answered",
      });
      return;
    }

    if (studentAnswer === "MULTIPLE") {
      ambiguousAnswers++;
      results.push({
        questionNumber,
        studentAnswer: "MULTIPLE",
        correctAnswer: keyAnswer.correctAnswer,
        isCorrect: false,
        score: 0,
        maxScore,
        confidence,
        answerType,
        status: "multiple",
        feedback: "Multiple answers detected - requires manual review",
      });
      return;
    }

    // Check if answer is correct
    const isCorrect = normalizedStudentAnswer === correctAnswer;
    const score = isCorrect ? maxScore : 0;

    if (isCorrect) {
      correctAnswers++;
      if (answerType === "mcq") {
        mcqCorrect++;
      } else if (answerType === "written") {
        writtenCorrect++;
      }
    } else {
      incorrectAnswers++;
    }

    totalScore += score;

    results.push({
      questionNumber,
      studentAnswer,
      correctAnswer: keyAnswer.correctAnswer,
      isCorrect,
      score,
      maxScore,
      confidence,
      answerType,
      status: isCorrect ? "correct" : "incorrect",
      feedback: isCorrect
        ? "Correct!"
        : `Incorrect. Correct answer: ${keyAnswer.correctAnswer}`,
    });
  });

  // Calculate statistics
  const maxPossibleScore = totalQuestions; // Assuming 1 mark per question
  const percentage = totalQuestions > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
  const averageConfidence =
    detectedAnswers.length > 0
      ? detectedAnswers.reduce((sum, a) => sum + (a.confidence || 0), 0) / detectedAnswers.length
      : 0;

  // Breakdown by answer type
  const mcqCount = detectedAnswers.filter((a) => a.answerType === "mcq").length;
  const writtenCount = detectedAnswers.filter((a) => a.answerType === "written").length;

  return {
    results,
    summary: {
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      blankAnswers,
      ambiguousAnswers,
      totalScore,
      maxPossibleScore,
      percentage: percentage.toFixed(2),
      averageConfidence: averageConfidence.toFixed(2),
      grade: calculateGrade(percentage),
      breakdown: {
        mcq: {
          total: mcqCount,
          correct: mcqCorrect,
          percentage: mcqCount > 0 ? ((mcqCorrect / mcqCount) * 100).toFixed(2) : "0.00",
        },
        written: {
          total: writtenCount,
          correct: writtenCorrect,
          percentage: writtenCount > 0 ? ((writtenCorrect / writtenCount) * 100).toFixed(2) : "0.00",
        },
      },
    },
    scoredAt: new Date(),
  };
};

/**
 * Calculate grade based on percentage
 */
const calculateGrade = (percentage) => {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  if (percentage >= 40) return "E";
  return "F";
};

module.exports = {
  gradeAnswer,
  gradeSubmission,
  regradeAnswer,
  gradeObjectiveQuestion,
  gradeSpmAnswerSheet,
  normalizeAnswer,
  calculateGrade,
};
