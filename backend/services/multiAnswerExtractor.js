// backend/services/multiAnswerExtractor.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Extract multiple numbered answers from a single image
 * Supports both handwritten and printed text
 *
 * @param {string} imageBase64 - Base64 encoded image data URL
 * @param {string} geminiApiKey - Gemini API key
 * @param {Object} options - Optional configuration
 * @param {number} options.expectedQuestionCount - Expected number of questions
 * @param {string} options.assessmentId - Assessment ID for context
 * @returns {Promise<Object>} Extracted answers with metadata
 */
const extractMultipleAnswers = async (imageBase64, geminiApiKey, options = {}) => {
  const startTime = Date.now();
  const { expectedQuestionCount, assessmentId } = options;

  try {
    // Validate base64 format
    if (!imageBase64.startsWith("data:image/") && !imageBase64.startsWith("data:application/pdf")) {
      throw new Error("Invalid file format. Expected image or PDF base64 data URL.");
    }

    // Extract base64 data and mime type
    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid base64 format");
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // Check file size
    const sizeInMB = (base64Data.length * 0.75) / (1024 * 1024);
    if (sizeInMB > 50) {
      throw new Error(`File size (${sizeInMB.toFixed(2)} MB) exceeds 50MB limit`);
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Build the prompt for multi-answer extraction
    const prompt = buildMultiAnswerPrompt(expectedQuestionCount);

    console.log("🚀 Extracting multiple answers from image...");

    // Call Gemini Vision API
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse the response
    let extractionResult;
    try {
      const cleanedText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      extractionResult = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse extraction response:", parseError);
      throw new Error("Failed to parse AI response. Please try again.");
    }

    // Validate the result
    if (!extractionResult.answers || !Array.isArray(extractionResult.answers)) {
      throw new Error("Invalid response structure: missing answers array");
    }

    // Sort answers by question number
    extractionResult.answers.sort((a, b) => a.questionNumber - b.questionNumber);

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ Extracted ${extractionResult.answers.length} answers in ${processingTime}s`);

    return {
      success: true,
      answers: extractionResult.answers,
      totalDetected: extractionResult.answers.length,
      metadata: {
        ...extractionResult.metadata,
        processingTime: `${processingTime}s`,
        fileSize: `${sizeInMB.toFixed(2)} MB`,
        model: "gemini-2.0-flash",
        expectedCount: expectedQuestionCount || null,
      },
    };
  } catch (error) {
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ Multi-answer extraction error after ${processingTime}s:`, error);

    throw error;
  }
};

/**
 * Build the AI prompt for multi-answer extraction
 */
const buildMultiAnswerPrompt = (expectedQuestionCount) => {
  const countHint = expectedQuestionCount
    ? `\n\nNOTE: The image is expected to contain approximately ${expectedQuestionCount} answers.`
    : "";

  return `You are analyzing an image containing a student's answers to multiple questions.
The student has written their answers in a NUMBERED LIST format.

ANSWER FORMAT DETECTION:
The answers may be written in various formats:
- "1) Answer text" or "1. Answer text"
- "1: Answer text" or "1- Answer text"
- "Q1: Answer text" or "Q1. Answer text"
- "(1) Answer text"
- Just "1 Answer text" with space after number

TEXT TYPE:
- The text can be HANDWRITTEN or PRINTED/TYPED
- For handwritten text, focus on legibility and extract the most likely interpretation
- For printed text, extract exactly as shown

YOUR TASK:
1. Identify ALL numbered answers in the image
2. Extract the answer text for each question number
3. Assign a confidence score based on legibility
4. Handle multi-line answers by combining them${countHint}

EXTRACTION RULES:
✓ Extract ONLY the answer text (not the question number prefix)
✓ Preserve the original wording and punctuation
✓ For answers with multiple items (e.g., "hiking, swimming"), keep them together
✓ If an answer is blank or missing, skip that question number
✓ If text is unclear, provide your best interpretation with lower confidence
✓ Handle common OCR challenges (similar letters: l/1, O/0, etc.)

CONFIDENCE SCORING:
- 0.95-1.0: Crystal clear, easily readable text
- 0.85-0.94: Clear text with minor ambiguity
- 0.70-0.84: Readable but some interpretation needed
- 0.50-0.69: Difficult to read, significant uncertainty
- Below 0.50: Very unclear, best guess only

Return your analysis in this EXACT JSON format (no markdown, just JSON):
{
  "answers": [
    {
      "questionNumber": 1,
      "answerText": "the extracted answer text",
      "confidence": 0.95,
      "notes": "optional notes about extraction challenges"
    },
    {
      "questionNumber": 2,
      "answerText": "another answer",
      "confidence": 0.90,
      "notes": ""
    }
  ],
  "metadata": {
    "totalDetected": 20,
    "format": "numbered_list",
    "textType": "handwritten|printed|mixed",
    "language": "English",
    "overallLegibility": "high|medium|low",
    "detectionNotes": "Any relevant observations about the image quality or formatting"
  }
}

IMPORTANT:
- Return ALL detected answers, sorted by question number
- Question numbers should be integers (1, 2, 3...), not strings
- Confidence should be a decimal between 0 and 1
- If the image contains no recognizable numbered answers, return empty answers array`;
};

/**
 * Validate extracted answers against expected format
 */
const validateExtractedAnswers = (answers, expectedCount) => {
  const validation = {
    isValid: true,
    warnings: [],
    errors: [],
  };

  if (!answers || answers.length === 0) {
    validation.isValid = false;
    validation.errors.push("No answers were detected in the image");
    return validation;
  }

  // Check if expected count matches
  if (expectedCount && answers.length !== expectedCount) {
    validation.warnings.push(
      `Expected ${expectedCount} answers but detected ${answers.length}`
    );
  }

  // Check for missing question numbers
  const questionNumbers = answers.map(a => a.questionNumber);
  const maxQuestion = Math.max(...questionNumbers);
  const missingNumbers = [];

  for (let i = 1; i <= maxQuestion; i++) {
    if (!questionNumbers.includes(i)) {
      missingNumbers.push(i);
    }
  }

  if (missingNumbers.length > 0) {
    validation.warnings.push(
      `Missing answers for questions: ${missingNumbers.join(", ")}`
    );
  }

  // Check for low confidence answers
  const lowConfidenceAnswers = answers.filter(a => a.confidence < 0.7);
  if (lowConfidenceAnswers.length > 0) {
    validation.warnings.push(
      `${lowConfidenceAnswers.length} answer(s) have low confidence and may need review`
    );
  }

  return validation;
};

module.exports = {
  extractMultipleAnswers,
  validateExtractedAnswers,
};
