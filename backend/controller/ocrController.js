// backend/controller/ocrController.js (Enhanced for Answer Recognition)
const { GoogleGenerativeAI } = require("@google/generative-ai");
const User = require("../model/User");
const StudentAnswer = require("../model/StudentAnswer");

/**
 * @desc    Extract text from single image (standalone)
 * @route   POST /api/ocr/extract
 * @access  Private
 */
const extractTextFromImage = async (req, res) => {
  const startTime = Date.now();

  try {
    console.log("📝 Starting Gemini OCR extraction...");

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "No image data provided",
      });
    }

    // Validate base64 format
    if (!image.startsWith("data:image/")) {
      return res.status(400).json({
        success: false,
        message: "Invalid image format. Expected base64 data URL.",
      });
    }

    // Get user with Gemini API key
    const user = await User.findById(req.user.id).select("+geminiApiKey");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const geminiApiKey = user.getGeminiApiKey();

    if (!geminiApiKey) {
      return res.status(400).json({
        success: false,
        message:
          "No Gemini API key found. Please add your API key in profile settings.",
      });
    }

    console.log("🔑 Gemini API key found, processing image...");

    // Extract base64 data and mime type
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({
        success: false,
        message: "Invalid base64 image format",
      });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // Check image size
    const sizeInMB = (base64Data.length * 0.75) / (1024 * 1024);
    console.log(`📏 Image size: ${sizeInMB.toFixed(2)} MB`);

    if (sizeInMB > 50) {
      return res.status(400).json({
        success: false,
        message: `Image size (${sizeInMB.toFixed(
          2
        )} MB) exceeds 50MB limit. Please compress the image.`,
      });
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Prepare prompt for OCR
    const prompt = `Extract all handwritten text from this student answer sheet image. 

Instructions:
- Transcribe exactly what you see, maintaining the original layout and line breaks
- If text is unclear or illegible, mark it as [unclear]
- Preserve punctuation and formatting
- If the image contains no text, respond with "No text detected"
- Do not add explanations or commentary, only transcribe the text

Return the extracted text in this JSON format:
{
  "extractedText": "the full extracted text here",
  "confidence": 0.95,
  "metadata": {
    "language": "detected language",
    "textType": "handwritten/printed/mixed",
    "legibility": "high/medium/low",
    "notes": "any relevant observations"
  }
}`;

    console.log("🚀 Sending image to Gemini Vision API...");

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

    console.log("📥 Received response from Gemini");

    // Parse response
    let ocrResult;
    try {
      const cleanedText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      ocrResult = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("❌ Failed to parse Gemini response:", parseError);
      ocrResult = {
        extractedText: text.trim(),
        confidence: 0.5,
        metadata: {
          language: "unknown",
          textType: "unknown",
          legibility: "unknown",
          notes: "Response parsing failed, using raw text",
        },
      };
    }

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ OCR completed in ${processingTime}s`);
    console.log(
      `📊 Extracted ${ocrResult.extractedText.length} characters with ${(
        ocrResult.confidence * 100
      ).toFixed(0)}% confidence`
    );

    return res.status(200).json({
      success: true,
      data: {
        extractedText: ocrResult.extractedText,
        confidence: ocrResult.confidence,
        metadata: {
          ...ocrResult.metadata,
          processingTime: `${processingTime}s`,
          imageSize: `${sizeInMB.toFixed(2)} MB`,
          model: "gemini-2.0-flash-exp",
        },
      },
      message: "Text extracted successfully",
    });
  } catch (error) {
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ Gemini OCR Error after ${processingTime}s:`, error);

    let errorMessage = "Failed to extract text from image";
    let statusCode = 500;

    if (error.message?.includes("API_KEY_INVALID")) {
      errorMessage =
        "Invalid Gemini API key. Please check your API key in profile settings.";
      statusCode = 401;
    } else if (error.message?.includes("RESOURCE_EXHAUSTED")) {
      errorMessage =
        "Gemini API quota exceeded. Please try again later or check your API limits.";
      statusCode = 429;
    } else if (error.message?.includes("INVALID_ARGUMENT")) {
      errorMessage =
        "Invalid image format or size. Please ensure the image is valid.";
      statusCode = 400;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      processingTime: `${processingTime}s`,
    });
  }
};

/**
 * @desc    Process OCR for a specific student submission
 * @route   POST /api/ocr/process-submission/:submissionId
 * @access  Private
 */
const processSubmissionOCR = async (req, res) => {
  const startTime = Date.now();

  try {
    console.log("📝 Processing OCR for submission...");

    const { submissionId } = req.params;

    // Find submission
    const submission = await StudentAnswer.findById(submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    // Update processing status
    submission.processingStatus = "processing_ocr";
    await submission.save();

    // Get user with Gemini API key
    const user = await User.findById(req.user.id).select("+geminiApiKey");
    const geminiApiKey = user.getGeminiApiKey();

    if (!geminiApiKey) {
      return res.status(400).json({
        success: false,
        message: "No Gemini API key found.",
      });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const results = [];
    let totalConfidence = 0;
    let processedCount = 0;

    // Process each answer
    for (let i = 0; i < submission.answers.length; i++) {
      const answer = submission.answers[i];

      console.log(
        `📝 Processing question ${answer.questionNumber} (${i + 1}/${
          submission.answers.length
        })`
      );

      try {
        if (
          !answer.originalImage ||
          !answer.originalImage.startsWith("data:image/")
        ) {
          console.log(
            `⚠️ Skipping question ${answer.questionNumber} - no valid image`
          );
          answer.status = "ocr_completed";
          answer.ocrData = {
            extractedText: "",
            confidence: 0,
            metadata: {
              language: "unknown",
              textType: "no_image",
              legibility: "n/a",
              notes: "No image provided",
            },
            processedAt: new Date(),
          };
          continue;
        }

        // Extract image data
        const matches = answer.originalImage.match(
          /^data:([A-Za-z-+\/]+);base64,(.+)$/
        );
        if (!matches) {
          throw new Error("Invalid image format");
        }

        const mimeType = matches[1];
        const base64Data = matches[2];

        // OCR prompt
        const prompt = `Extract all handwritten text from this student answer for Question ${answer.questionNumber}. Return JSON with extractedText, confidence, and metadata.`;

        // Call Gemini
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

        let ocrResult;
        try {
          const cleanedText = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
          ocrResult = JSON.parse(cleanedText);
        } catch (parseError) {
          ocrResult = {
            extractedText: text.trim(),
            confidence: 0.5,
            metadata: {
              language: "unknown",
              textType: "handwritten",
              legibility: "medium",
              notes: "Response parsing failed",
            },
          };
        }

        // Update answer with OCR data
        answer.ocrData = {
          extractedText: ocrResult.extractedText,
          confidence: ocrResult.confidence,
          metadata: ocrResult.metadata,
          processedAt: new Date(),
        };

        answer.status = "ocr_completed";

        totalConfidence += ocrResult.confidence;
        processedCount++;

        results.push({
          questionNumber: answer.questionNumber,
          success: true,
          extractedText: ocrResult.extractedText,
          confidence: ocrResult.confidence,
        });

        // Small delay to avoid rate limiting
        if (i < submission.answers.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(
          `❌ Error processing question ${answer.questionNumber}:`,
          error
        );

        answer.status = "ocr_completed";
        answer.ocrData = {
          extractedText: "",
          confidence: 0,
          metadata: {
            error: error.message,
          },
          processedAt: new Date(),
        };

        submission.addError("ocr", answer.questionNumber, error.message);

        results.push({
          questionNumber: answer.questionNumber,
          success: false,
          error: error.message,
        });
      }
    }

    // Calculate overall stats
    submission.overallStats.questionsAttempted = processedCount;
    submission.overallStats.averageConfidence =
      processedCount > 0 ? totalConfidence / processedCount : 0;
    submission.overallStats.processingTime = (Date.now() - startTime) / 1000;

    // Update processing status
    const lowConfidence = submission.answers.some(
      (a) => a.ocrData && a.ocrData.confidence < 0.6
    );
    submission.processingStatus = lowConfidence
      ? "requires_review"
      : "completed";

    await submission.save();

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ OCR processing completed in ${processingTime}s`);

    res.status(200).json({
      success: true,
      message: `OCR completed for ${processedCount} questions`,
      data: {
        submissionId: submission._id,
        results,
        summary: {
          total: submission.answers.length,
          processed: processedCount,
          averageConfidence: submission.overallStats.averageConfidence,
          processingTime: `${processingTime}s`,
          status: submission.processingStatus,
        },
      },
    });
  } catch (error) {
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ OCR processing error after ${processingTime}s:`, error);

    // Update submission with error status
    if (req.params.submissionId) {
      try {
        await StudentAnswer.findByIdAndUpdate(req.params.submissionId, {
          processingStatus: "error",
          $push: {
            errors: {
              stage: "ocr",
              message: error.message,
              timestamp: new Date(),
            },
          },
        });
      } catch (updateError) {
        console.error("Failed to update submission error status:", updateError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Error processing OCR",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      processingTime: `${processingTime}s`,
    });
  }
};

/**
 * @desc    Batch process OCR for multiple submissions
 * @route   POST /api/ocr/batch-process
 * @access  Private
 */
const batchProcessOCR = async (req, res) => {
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

    console.log(`📊 Batch processing ${submissionIds.length} submissions...`);

    // Get user with API key
    const user = await User.findById(req.user.id).select("+geminiApiKey");
    const geminiApiKey = user.getGeminiApiKey();

    if (!geminiApiKey) {
      return res.status(400).json({
        success: false,
        message: "No Gemini API key found.",
      });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const results = {
      successful: [],
      failed: [],
    };

    // Process each submission
    for (let i = 0; i < submissionIds.length; i++) {
      const submissionId = submissionIds[i];
      console.log(
        `\n📝 Processing submission ${i + 1}/${submissionIds.length}...`
      );

      try {
        const submission = await StudentAnswer.findById(submissionId);

        if (!submission) {
          results.failed.push({
            submissionId,
            reason: "Submission not found",
          });
          continue;
        }

        // Update status
        submission.processingStatus = "processing_ocr";
        await submission.save();

        let totalConfidence = 0;
        let processedCount = 0;

        // Process each answer in submission
        for (const answer of submission.answers) {
          try {
            if (
              !answer.originalImage ||
              !answer.originalImage.startsWith("data:image/")
            ) {
              answer.status = "ocr_completed";
              answer.ocrData = {
                extractedText: "",
                confidence: 0,
                metadata: { notes: "No image provided" },
                processedAt: new Date(),
              };
              continue;
            }

            const matches = answer.originalImage.match(
              /^data:([A-Za-z-+\/]+);base64,(.+)$/
            );
            if (!matches) continue;

            const mimeType = matches[1];
            const base64Data = matches[2];

            const prompt = `Extract handwritten text from student answer for Question ${answer.questionNumber}. Return JSON.`;

            const result = await model.generateContent([
              prompt,
              { inlineData: { mimeType, data: base64Data } },
            ]);

            const response = await result.response;
            const text = response.text();

            let ocrResult;
            try {
              const cleaned = text
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();
              ocrResult = JSON.parse(cleaned);
            } catch {
              ocrResult = {
                extractedText: text.trim(),
                confidence: 0.5,
                metadata: {},
              };
            }

            answer.ocrData = {
              extractedText: ocrResult.extractedText,
              confidence: ocrResult.confidence,
              metadata: ocrResult.metadata || {},
              processedAt: new Date(),
            };

            answer.status = "ocr_completed";
            totalConfidence += ocrResult.confidence;
            processedCount++;

            // Delay between questions
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (answerError) {
            console.error(
              `Error processing question ${answer.questionNumber}:`,
              answerError
            );
            answer.status = "ocr_completed";
            answer.ocrData = {
              extractedText: "",
              confidence: 0,
              metadata: { error: answerError.message },
              processedAt: new Date(),
            };
          }
        }

        // Update submission stats
        submission.overallStats.questionsAttempted = processedCount;
        submission.overallStats.averageConfidence =
          processedCount > 0 ? totalConfidence / processedCount : 0;

        const lowConfidence = submission.answers.some(
          (a) => a.ocrData && a.ocrData.confidence < 0.6
        );
        submission.processingStatus = lowConfidence
          ? "requires_review"
          : "completed";

        await submission.save();

        results.successful.push({
          submissionId,
          questionsProcessed: processedCount,
          averageConfidence: submission.overallStats.averageConfidence,
        });

        // Delay between submissions
        if (i < submissionIds.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (submissionError) {
        console.error(
          `Error processing submission ${submissionId}:`,
          submissionError
        );
        results.failed.push({
          submissionId,
          reason: submissionError.message,
        });
      }
    }

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n✅ Batch processing completed in ${processingTime}s`);

    res.status(200).json({
      success: true,
      message: `Processed ${results.successful.length} of ${submissionIds.length} submissions`,
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
    console.error(`❌ Batch processing error after ${processingTime}s:`, error);

    res.status(500).json({
      success: false,
      message: "Error in batch processing",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      processingTime: `${processingTime}s`,
    });
  }
};

/**
 * @desc    Get OCR processing status for a submission
 * @route   GET /api/ocr/status/:submissionId
 * @access  Private
 */
const getOCRStatus = async (req, res) => {
  try {
    const submission = await StudentAnswer.findById(req.params.submissionId)
      .select(
        "processingStatus overallStats answers.status answers.questionNumber answers.ocrData.confidence"
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
      confidence: a.ocrData?.confidence || 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        submissionId: submission._id,
        processingStatus: submission.processingStatus,
        overallStats: submission.overallStats,
        questionStatus,
      },
    });
  } catch (error) {
    console.error("Get OCR status error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching OCR status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Retry OCR for failed questions
 * @route   POST /api/ocr/retry/:submissionId
 * @access  Private
 */
const retryFailedOCR = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { questionNumbers } = req.body; // Optional: specific questions to retry

    const submission = await StudentAnswer.findById(submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
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

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const results = [];

    // Determine which questions to retry
    const questionsToRetry = questionNumbers
      ? submission.answers.filter((a) =>
          questionNumbers.includes(a.questionNumber)
        )
      : submission.answers.filter(
          (a) =>
            !a.ocrData || !a.ocrData.extractedText || a.ocrData.confidence < 0.5
        );

    console.log(`🔄 Retrying OCR for ${questionsToRetry.length} questions...`);

    for (const answer of questionsToRetry) {
      try {
        if (
          !answer.originalImage ||
          !answer.originalImage.startsWith("data:image/")
        ) {
          results.push({
            questionNumber: answer.questionNumber,
            success: false,
            reason: "No valid image",
          });
          continue;
        }

        const matches = answer.originalImage.match(
          /^data:([A-Za-z-+\/]+);base64,(.+)$/
        );
        if (!matches) continue;

        const mimeType = matches[1];
        const base64Data = matches[2];

        const prompt = `Extract handwritten text from this student answer for Question ${answer.questionNumber}. Return JSON.`;

        const result = await model.generateContent([
          prompt,
          { inlineData: { mimeType, data: base64Data } },
        ]);

        const response = await result.response;
        const text = response.text();

        let ocrResult;
        try {
          const cleaned = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
          ocrResult = JSON.parse(cleaned);
        } catch {
          ocrResult = {
            extractedText: text.trim(),
            confidence: 0.5,
            metadata: {},
          };
        }

        answer.ocrData = {
          extractedText: ocrResult.extractedText,
          confidence: ocrResult.confidence,
          metadata: ocrResult.metadata || {},
          processedAt: new Date(),
        };

        answer.status = "ocr_completed";

        results.push({
          questionNumber: answer.questionNumber,
          success: true,
          confidence: ocrResult.confidence,
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          questionNumber: answer.questionNumber,
          success: false,
          reason: error.message,
        });
      }
    }

    // Recalculate stats
    submission.calculateOverallStats();
    await submission.save();

    res.status(200).json({
      success: true,
      message: `Retried OCR for ${questionsToRetry.length} questions`,
      data: results,
    });
  } catch (error) {
    console.error("Retry OCR error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrying OCR",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Process SPM Paper 1 Answer Sheet (MCQ bubble detection)
 * @route   POST /api/ocr/process-spm-answer-sheet
 * @access  Private
 */
const processSpmAnswerSheet = async (req, res) => {
  const startTime = Date.now();

  try {
    console.log("📝 Processing SPM Paper 1 Answer Sheet...");

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const { image, assessmentId } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "No image data provided",
      });
    }

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required",
      });
    }

    // Validate base64 format
    if (!image.startsWith("data:image/")) {
      return res.status(400).json({
        success: false,
        message: "Invalid image format. Expected base64 data URL.",
      });
    }

    // Get user with Gemini API key
    const user = await User.findById(req.user.id).select("+geminiApiKey");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const geminiApiKey = user.getGeminiApiKey();

    if (!geminiApiKey) {
      return res.status(400).json({
        success: false,
        message:
          "No Gemini API key found. Please add your API key in profile settings.",
      });
    }

    console.log("🔑 Gemini API key found, processing answer sheet...");

    // Extract base64 data and mime type
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({
        success: false,
        message: "Invalid base64 image format",
      });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Specialized prompt for SPM answer sheet - HYBRID DETECTION
    const prompt = `You are analyzing an SPM Paper 1 answer sheet with 40 questions.

ANSWER SHEET STRUCTURE:
The answer sheet has a table with 3 columns:
1. Question numbers (1-40) in the left column
2. Answer bubbles (A-H circles) in the middle column - for MCQ answers
3. "SPACE FOR ANSWER THAT ARE A WORD, PHRASE OR NUMBER" in the right column - for written answers

MCQ BUBBLE FORMAT (Questions 1-36):
Each question row shows: A ⃝ B ⃝ C ⃝ D ⃝ E ⃝ F ⃝ G ⃝ H ⃝
- The letter (A, B, C, D, E, F, G, or H) appears to the LEFT of each circle
- When a student selects an answer, they FILL/BLACKEN/SHADE the circle next to that letter
- Look for the FILLED/DARKENED/SHADED circle (⚫ or ●) and return the LETTER that appears to its LEFT
- Example: If you see "A ⃝ B ● C ⃝ D ⃝", the answer is "B" (because B's circle is filled)
- Example: If you see "A ⃝ B ⃝ C ⃝ D ⚫", the answer is "D" (because D's circle is filled)

DETECTION RULES:
- **Questions 1-36**: MCQ only - detect which circle is FILLED/BLACKENED, then return the LETTER to its left
- **Questions 37-40**: Written answers only - extract the word/phrase/number from the RIGHT COLUMN (third column)

Your task:
1. For Q1-36: Find the FILLED/BLACKENED circle and return the letter to its LEFT.
   - Scan the pattern: A ⃝ B ⃝ C ⃝ D ⃝ E ⃝ F ⃝ G ⃝ H ⃝
   - Identify which circle is darkened/filled (looks like ⚫ or ● or completely shaded)
   - Return the LETTER that appears immediately to the left of that filled circle
   - If no circle is filled, return "BLANK"
   - If multiple circles are filled, return "MULTIPLE"

2. For Q37-40: Extract text from the RIGHT COLUMN (written answer space).
   - Return the exact word/phrase/number written
   - If nothing written, return "BLANK"
   - Ignore bubbles for Q37-40

Return a JSON object with this EXACT structure:
{
  "answers": [
    {"questionNumber": 1, "selectedAnswer": "A", "confidence": 0.95, "answerType": "mcq"},
    {"questionNumber": 2, "selectedAnswer": "B", "confidence": 0.90, "answerType": "mcq"},
    ...questions 1-36 are "mcq" type...
    {"questionNumber": 37, "selectedAnswer": "photosynthesis", "confidence": 0.85, "answerType": "written"},
    {"questionNumber": 38, "selectedAnswer": "enzyme", "confidence": 0.90, "answerType": "written"},
    {"questionNumber": 39, "selectedAnswer": "BLANK", "confidence": 0.60, "answerType": "written"},
    {"questionNumber": 40, "selectedAnswer": "mitochondria", "confidence": 0.88, "answerType": "written"}
  ],
  "overallConfidence": 0.92,
  "metadata": {
    "totalQuestions": 40,
    "mcqQuestions": 36,
    "writtenQuestions": 4,
    "answeredQuestions": 38,
    "blankQuestions": 2,
    "ambiguousQuestions": 0,
    "notes": "Any relevant observations"
  }
}

CRITICAL RULES:
- Return ALL 40 questions even if blank
- Confidence should be 0.0-1.0
- Q1-36: The format is "LETTER ⃝" repeated (A ⃝ B ⃝ C ⃝ D ⃝ E ⃝ F ⃝ G ⃝ H ⃝)
- When a circle is FILLED/BLACK (⚫), return the letter to its LEFT
- Q37-40: Extract handwritten/printed text from RIGHT column (word/phrase/number space)
- Be conservative: if uncertain, mark as "BLANK" with low confidence
- For Q37-40, ignore the bubbles completely - only read the written answer space`;

    console.log("🚀 Sending answer sheet to Gemini Vision API...");

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

    console.log("📥 Received response from Gemini");

    // Parse response
    let detectionResult;
    try {
      const cleanedText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      detectionResult = JSON.parse(cleanedText);

      // Validate structure
      if (
        !detectionResult.answers ||
        !Array.isArray(detectionResult.answers) ||
        detectionResult.answers.length !== 40
      ) {
        throw new Error(
          `Invalid response structure: expected 40 answers, got ${detectionResult.answers?.length || 0}`
        );
      }
    } catch (parseError) {
      console.error("❌ Failed to parse Gemini response:", parseError);
      return res.status(500).json({
        success: false,
        message: "Failed to parse answer sheet detection results",
        error: parseError.message,
        rawResponse: text.substring(0, 500), // First 500 chars for debugging
      });
    }

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ Answer sheet processed in ${processingTime}s`);
    console.log(
      `📊 Detected ${detectionResult.metadata?.answeredQuestions || 0}/40 answers`
    );

    return res.status(200).json({
      success: true,
      data: {
        answers: detectionResult.answers,
        overallConfidence: detectionResult.overallConfidence,
        metadata: {
          ...detectionResult.metadata,
          processingTime: `${processingTime}s`,
          model: "gemini-2.0-flash-exp",
        },
      },
      message: "Answer sheet processed successfully",
    });
  } catch (error) {
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(
      `❌ SPM Answer Sheet Processing Error after ${processingTime}s:`,
      error
    );

    let errorMessage = "Failed to process answer sheet";
    let statusCode = 500;

    if (error.message?.includes("API_KEY_INVALID")) {
      errorMessage =
        "Invalid Gemini API key. Please check your API key in profile settings.";
      statusCode = 401;
    } else if (error.message?.includes("RESOURCE_EXHAUSTED")) {
      errorMessage =
        "Gemini API quota exceeded. Please try again later or check your API limits.";
      statusCode = 429;
    } else if (error.message?.includes("INVALID_ARGUMENT")) {
      errorMessage =
        "Invalid image format or size. Please ensure the image is valid.";
      statusCode = 400;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      processingTime: `${processingTime}s`,
    });
  }
};

module.exports = {
  extractTextFromImage,
  processSubmissionOCR,
  batchProcessOCR,
  getOCRStatus,
  retryFailedOCR,
  processSpmAnswerSheet,
};
