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
 * Grade an essay using a rubric
 */
const gradeEssay = async ({ essayText, rubric, geminiApiKey }) => {
  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Build rubric description for the prompt
    let rubricDescription = `Title: ${rubric.title || "Essay Grading"}\n`;
    rubricDescription += `Description: ${rubric.description || ""}\n\n`;
    rubricDescription += `Grading Criteria:\n`;

    // Add each criterion
    if (rubric.criteria && Array.isArray(rubric.criteria)) {
      rubric.criteria.forEach((criterion, index) => {
        rubricDescription += `${index + 1}. ${criterion.name || criterion.criterion}: ${criterion.description || ""} (${criterion.points || criterion.maxPoints || 0} points)\n`;
      });
    }

    rubricDescription += `\nTotal Points: ${rubric.totalPoints || 0}`;

    const prompt = `You are an expert English teacher grading a student essay according to Malaysian KSSM (Kurikulum Standard Sekolah Menengah) standards. You must be RIGOROUS and STRICT in your evaluation.

**CRITICAL GRADING GUIDELINES (KSSM Standards):**
You MUST deduct marks for ANY of the following issues:
1. Grammar & Mechanics (BE STRICT):
   - Deduct for subject-verb agreement errors
   - Deduct for tense inconsistencies
   - Deduct for spelling mistakes
   - Deduct for punctuation errors
   - Deduct for sentence fragments or run-ons
   - Deduct for improper capitalization

2. Vocabulary & Language Use (BE CRITICAL):
   - Deduct for repetitive vocabulary
   - Deduct for basic/simplistic word choices
   - Deduct for inappropriate word usage
   - Deduct for lack of varied sentence structures
   - Award points only for sophisticated vocabulary appropriate to KSSM level

3. Content & Ideas (BE THOROUGH):
   - Deduct if ideas are underdeveloped or superficial
   - Deduct if examples lack specific details
   - Deduct if content is off-topic or irrelevant
   - Deduct if required elements from rubric are missing
   - Award full points only for well-developed, detailed content

4. Organization & Coherence (BE PRECISE):
   - Deduct for poor paragraph structure
   - Deduct for lack of clear topic sentences
   - Deduct for missing transitions between ideas
   - Deduct for illogical flow of ideas
   - Deduct for weak or missing introduction/conclusion

5. KSSM-Specific Requirements:
   - Essays must demonstrate critical thinking (HOTS - Higher Order Thinking Skills)
   - Must show depth of understanding, not just surface-level description
   - Must use appropriate register and tone for the essay type
   - Must meet word count requirements (if specified)

**SCORING RIGOR:**
- 90-100%: EXCEPTIONAL work with minimal errors, sophisticated language, excellent organization
- 80-89%: VERY GOOD work with few errors, good vocabulary, clear structure
- 70-79%: GOOD work with some errors, adequate vocabulary, satisfactory structure
- 60-69%: SATISFACTORY work with multiple errors, basic vocabulary, acceptable structure
- 50-59%: WEAK work with many errors, limited vocabulary, poor structure
- Below 50%: POOR work with serious deficiencies

**Rubric:**
${rubricDescription}

**Student Essay:**
${essayText}

**MANDATORY EVALUATION PROCESS:**
1. Count and identify ALL grammar and spelling errors
2. Identify ALL instances of repetitive or basic vocabulary
3. Check for proper paragraph structure (topic sentence, supporting details, conclusion)
4. Verify all rubric criteria are addressed with sufficient depth
5. Assess whether the essay demonstrates KSSM-appropriate critical thinking
6. Calculate score based on actual performance against rubric criteria

**DO NOT:**
- Award high scores just because the essay is "readable"
- Ignore grammar, spelling, or punctuation errors
- Be lenient with basic or repetitive language
- Give full marks unless the essay is truly exceptional
- Assume meeting minimum requirements deserves high scores

**RETURN YOUR GRADING IN THIS EXACT JSON FORMAT:**
{
  "score": <total points earned - BE STRICT AND REALISTIC>,
  "maxScore": ${rubric.totalPoints || 100},
  "criteriaScores": [
    {
      "criterion": "criterion name",
      "pointsEarned": <points - deduct for every flaw>,
      "maxPoints": <max points for this criterion>,
      "feedback": "specific feedback explaining deductions and what was done well"
    }
  ],
  "feedback": "Overall feedback that MUST mention specific errors found, strengths demonstrated, and concrete areas for improvement",
  "reasoning": "Detailed explanation listing specific errors (e.g., 'Found 3 subject-verb agreement errors', 'Vocabulary repetition of basic words like X', 'Paragraph 2 lacks clear topic sentence', etc.)",
  "semanticSimilarity": <number between 0 and 1 - be realistic, 0.7+ only for genuinely strong essays>,
  "keyPointsMatched": ["specific strength 1 with example", "specific strength 2 with example"],
  "keyPointsMissed": ["specific error/weakness 1 with example", "specific error/weakness 2 with example", "area for improvement with specific suggestion"]
}

**REMEMBER:** You are preparing Malaysian students for KSSM examinations. Be professionally rigorous. A score of 100% should be RARE and reserved for truly outstanding work. Most good essays should score in the 70-85% range. Only award higher scores when the work is genuinely exceptional according to KSSM standards.`;

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
      console.error("Failed to parse essay grading response:", parseError);
      throw new Error("Invalid grading response format");
    }

    // Validate and format result
    const maxScore = rubric.totalPoints || 100;
    return {
      score: Math.min(Math.max(0, gradingResult.score || 0), maxScore),
      maxScore: maxScore,
      percentage: ((gradingResult.score || 0) / maxScore) * 100,
      feedback: gradingResult.feedback || "No feedback provided",
      reasoning: gradingResult.reasoning || "",
      criteriaScores: gradingResult.criteriaScores || [],
      comparisonMetadata: {
        semanticSimilarity: gradingResult.semanticSimilarity || 0,
        keyPointsMatched: gradingResult.keyPointsMatched || [],
        keyPointsMissed: gradingResult.keyPointsMissed || [],
      },
      scoredAt: new Date(),
    };
  } catch (error) {
    console.error("Essay grading error:", error);
    throw error;
  }
};

/**
 * Grade multiple answers in a submission
 */
const gradeSubmission = async (submission, assessment, geminiApiKey) => {
  const results = [];
  let totalScore = 0;
  let maxPossibleScore = 0;

  // Determine if this is an essay (uses rubric) or assessment (uses answer key)
  const isEssay = assessment.activityType === "essay" && assessment.generatedContent?.rubricContent;
  const answerKey = assessment.generatedContent?.answerKeyContent?.answers || [];
  const rubric = assessment.generatedContent?.rubricContent;

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

      // Handle essay grading (uses rubric instead of answer key)
      if (isEssay) {
        // For essays, we grade the entire essay using the rubric
        const studentAnswerText =
          answer.isEdited && answer.editedText
            ? answer.editedText
            : answer.ocrData.extractedText;

        const gradingResult = await gradeEssay({
          essayText: studentAnswerText,
          rubric: rubric,
          geminiApiKey,
        });

        // Update answer with grading results
        answer.grading = {
          rubricUsed: null,
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
        continue;
      }

      // Find corresponding answer key (for non-essay assessments)
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
 * Grade SPM Paper 1 Answer Sheet
 *
 * ANSWER SHEET FORMAT (Total: 40 questions):
 * - Questions 1-32: Multiple choice bubbles (A-H) - 32 MCQ questions
 * - Questions 33-40: Short written answers on blank lines - 8 written questions (Part 5: Information Transfer)
 *
 * @param {Array} detectedAnswers - Array of detected answers from OCR [{questionNumber, selectedAnswer, confidence, answerType}]
 * @param {Array} answerKey - Answer key from assessment
 * @returns {Object} Grading results with score breakdown including MCQ and written answer statistics
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
  gradeEssay,
  gradeSubmission,
  regradeAnswer,
  gradeObjectiveQuestion,
  gradeSpmAnswerSheet,
  normalizeAnswer,
  calculateGrade,
};
