const { GoogleGenerativeAI } = require("@google/generative-ai");
const User = require("../model/User");

const extractTextFromImage = async (req, res) => {
  const startTime = Date.now();

  try {
    console.log("📝 Starting Gemini OCR extraction...");

    // Validate request
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

    // Get and decrypt Gemini API key
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

    // Check image size (base64 is ~1.37x original size)
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
    const prompt = `Extract all handwritten text from this image. 
    
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
      // Clean response text
      const cleanedText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      ocrResult = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("❌ Failed to parse Gemini response:", parseError);
      // Fallback: treat entire response as extracted text
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

    // Return result
    return res.status(200).json({
      success: true,
      data: {
        extractedText: ocrResult.extractedText,
        confidence: ocrResult.confidence,
        metadata: {
          ...ocrResult.metadata,
          processingTime: `${processingTime}s`,
          imageSize: `${sizeInMB.toFixed(2)} MB`,
          model: "gemini-1.5-flash",
        },
      },
      message: "Text extracted successfully",
    });
  } catch (error) {
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ Gemini OCR Error after ${processingTime}s:`, error);

    // Handle specific Gemini errors
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
 * Batch extract text from multiple images
 * Processes images sequentially to avoid API rate limits
 */
const batchExtractText = async (req, res) => {
  const startTime = Date.now();

  try {
    console.log("📊 Starting batch OCR extraction...");

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images provided or invalid format",
      });
    }

    if (images.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10 images allowed per batch",
      });
    }

    // Get user with Gemini API key
    const user = await User.findById(req.user.id).select("+geminiApiKey");
    const geminiApiKey = user.getGeminiApiKey();

    if (!geminiApiKey) {
      return res.status(400).json({
        success: false,
        message:
          "No Gemini API key found. Please add your API key in profile settings.",
      });
    }

    console.log(`📊 Processing ${images.length} images...`);

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const results = [];

    // Process images sequentially
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      console.log(`📝 Processing image ${i + 1}/${images.length}...`);

      try {
        // Validate image
        if (!image.startsWith("data:image/")) {
          results.push({
            success: false,
            error: "Invalid image format",
            extractedText: "",
            confidence: 0,
          });
          continue;
        }

        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches) {
          results.push({
            success: false,
            error: "Invalid base64 format",
            extractedText: "",
            confidence: 0,
          });
          continue;
        }

        const mimeType = matches[1];
        const base64Data = matches[2];

        // Same prompt as single extraction
        const prompt = `Extract all handwritten text from this image. Return JSON with: extractedText, confidence, and metadata.`;

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
            metadata: {},
          };
        }

        results.push({
          success: true,
          extractedText: ocrResult.extractedText,
          confidence: ocrResult.confidence,
          metadata: ocrResult.metadata,
        });

        // Small delay to avoid rate limiting
        if (i < images.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (imageError) {
        console.error(`❌ Error processing image ${i + 1}:`, imageError);
        results.push({
          success: false,
          error: imageError.message,
          extractedText: "",
          confidence: 0,
        });
      }
    }

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    const successCount = results.filter((r) => r.success).length;

    console.log(
      `✅ Batch processing completed: ${successCount}/${images.length} successful in ${processingTime}s`
    );

    return res.status(200).json({
      success: true,
      data: results,
      summary: {
        total: images.length,
        successful: successCount,
        failed: images.length - successCount,
        processingTime: `${processingTime}s`,
      },
      message: `Processed ${successCount}/${images.length} images successfully`,
    });
  } catch (error) {
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ Batch OCR Error after ${processingTime}s:`, error);

    return res.status(500).json({
      success: false,
      message: "Failed to process batch images",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      processingTime: `${processingTime}s`,
    });
  }
};

module.exports = {
  extractTextFromImage,
  batchExtractText,
};
