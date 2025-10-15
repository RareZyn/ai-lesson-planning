// services/assessmentGenerator.js

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { jsonrepair } = require("jsonrepair");
const {
  buildActivityPrompt,
  buildEssayPrompt,
  buildTextbookPrompt,
  buildAssessmentPrompt,
  buildEnhancedAssessmentPrompt,
  buildPaper1Prompt,
  buildPaper2Prompt,
} = require("./promptBuilder");

/**
 * Assessment Generator Service
 * Handles all AI content generation using Google Gemini
 */
class AssessmentGenerator {
  constructor(geminiApiKey) {
    this.genAI = new GoogleGenerativeAI(geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }

  /**
   * Parse and clean AI response
   */
  parseAIResponse(text) {
    try {
      const cleanedText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON. Raw text:", text);
      throw new Error("The AI response was not in a valid JSON format.");
    }
  }

  /**
   * Parse and repair AI response with jsonrepair
   */
  parseAndRepairAIResponse(text) {
    try {
      // Basic cleaning - remove markdown code blocks
      let cleanedText = text
        .trim()
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();

      // Find the JSON object boundaries
      const firstBrace = cleanedText.indexOf("{");
      const lastBrace = cleanedText.lastIndexOf("}");

      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error("No valid JSON object found in response");
      }

      // Extract only the JSON portion
      cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);

      console.log("🔧 Attempting to repair JSON...");

      // Use jsonrepair to fix any malformed JSON
      const repairedJson = jsonrepair(cleanedText);

      console.log("✅ JSON successfully repaired");

      return JSON.parse(repairedJson);
    } catch (parseError) {
      console.error("❌ Failed to parse and repair JSON.");
      console.error("Parse error:", parseError.message);

      // Fallback: Try to extract specific sections manually
      try {
        console.log("🔄 Attempting manual content extraction...");

        const examContentMatch = text.match(
          /"examContent"\s*:\s*\{[\s\S]*?(?=,\s*"answerKeyContent")/
        );
        const answerKeyMatch = text.match(
          /"answerKeyContent"\s*:\s*\{[\s\S]*?(?=\s*\}?\s*$)/
        );

        if (examContentMatch && answerKeyMatch) {
          const examContentStr = examContentMatch[0] + "}";
          const answerKeyStr = answerKeyMatch[0] + "}";

          const reconstructedJson = `{${examContentStr}, ${answerKeyStr}}`;

          // Try to repair the reconstructed JSON
          const repairedReconstructedJson = jsonrepair(reconstructedJson);
          const parsedContent = JSON.parse(repairedReconstructedJson);

          console.log(
            "✅ Successfully extracted and repaired content manually"
          );
          return parsedContent;
        } else {
          throw new Error("Could not extract JSON structure from response");
        }
      } catch (altParseError) {
        console.error(
          "❌ Manual extraction also failed:",
          altParseError.message
        );
        throw new Error(
          `Unable to parse AI response as valid JSON: ${parseError.message}`
        );
      }
    }
  }

  /**
   * Generate Activity Content
   */
  async generateActivity(data) {
    console.log("🎨 Generating activity content...");

    const result = await this.model.generateContent(buildActivityPrompt(data));
    const response = await result.response;
    const text = response.text();

    const generatedContent = this.parseAIResponse(text);

    // Validate required fields
    if (!generatedContent.activityContent || !generatedContent.rubricContent) {
      throw new Error("Missing required content fields in AI response");
    }

    return {
      activityContent: generatedContent.activityContent,
      rubricContent: generatedContent.rubricContent,
    };
  }

  /**
   * Generate Essay Content
   */
  async generateEssay(data) {
    console.log("📝 Generating essay content...");

    const result = await this.model.generateContent(buildEssayPrompt(data));
    const response = await result.response;
    const text = response.text();

    const generatedContent = this.parseAIResponse(text);

    return {
      activityContent: generatedContent.activityContent,
      rubricContent: generatedContent.rubricContent,
    };
  }

  /**
   * Generate Textbook Content
   */
  async generateTextbook(data) {
    console.log("📚 Generating textbook content...");

    const result = await this.model.generateContent(buildTextbookPrompt(data));
    const response = await result.response;
    const text = response.text();

    const generatedContent = this.parseAIResponse(text);

    return {
      activityContent: generatedContent.activityContent,
      rubricContent: generatedContent.rubricContent,
    };
  }

  /**
   * Generate Assessment Content
   */
  async generateAssessment(data) {
    console.log("✅ Generating assessment content...");

    const numberOfQuestions = data.numberOfQuestions || 20;
    console.log(`Generating assessment with ${numberOfQuestions} questions`);

    try {
      const result = await this.model.generateContent(
        buildAssessmentPrompt(data)
      );
      const response = await result.response;
      const text = response.text();

      console.log("Raw AI output preview:", text.substring(0, 500) + "...");

      const generatedContent = this.parseAIResponse(text);

      // Validate required fields for assessment
      if (
        !generatedContent.assessmentContent ||
        !generatedContent.answerKeyContent
      ) {
        console.error("Missing required assessment fields:", generatedContent);
        throw new Error(
          "Missing required assessment content fields in AI response"
        );
      }

      const result_content = {
        assessmentContent: generatedContent.assessmentContent,
        answerKeyContent: generatedContent.answerKeyContent,
      };

      console.log(`Generated content analysis:`, {
        assessmentContent: result_content.assessmentContent
          ? "Generated"
          : "Missing",
        answerKeyContent: result_content.answerKeyContent
          ? "Generated"
          : "Missing",
      });

      return result_content;
    } catch (error) {
      console.error("Error in generateAssessment:", error);

      // Try one more time with a more explicit prompt if first attempt fails
      if (!error.message.includes("retry")) {
        console.log("Retrying assessment generation with enhanced prompt...");
        return await this.retryAssessmentGeneration(data, numberOfQuestions);
      }

      throw error;
    }
  }

  /**
   * Retry Assessment Generation with enhanced prompt
   */
  async retryAssessmentGeneration(data, numberOfQuestions) {
    console.log(
      `Retrying assessment generation with emphasis on ${numberOfQuestions} questions`
    );

    const retryModel = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.5,
      },
    });

    const result = await retryModel.generateContent(
      buildEnhancedAssessmentPrompt(data, numberOfQuestions)
    );
    const response = await result.response;
    const text = response.text();

    console.log("Retry attempt - AI output length:", text.length);

    let generatedContent;
    try {
      const cleanedText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      generatedContent = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error(
        "Retry failed to parse Gemini response. Full output:",
        text
      );
      const retryError = new Error(
        "Retry failed - Invalid response format from AI"
      );
      retryError.message += " (retry)";
      throw retryError;
    }

    return {
      assessmentContent: generatedContent.assessmentContent,
      answerKeyContent: generatedContent.answerKeyContent,
    };
  }

  /**
   * Generate Exam Content (SPM Paper 1 or Paper 2)
   */
  async generateExam(data) {
    console.log("🎯 Generating SPM exam content with data:", {
      paperType: data.paperType,
      lesson: data.lesson,
      subject: data.subject,
      grade: data.grade,
    });

    try {
      let prompt;
      if (data.paperType === "paper1") {
        prompt = buildPaper1Prompt(data);
      } else if (data.paperType === "paper2") {
        prompt = buildPaper2Prompt(data);
      } else {
        throw new Error("Invalid paper type. Must be 'paper1' or 'paper2'");
      }

      console.log("🚀 Sending request to Gemini AI for", data.paperType);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log("📥 Raw AI output length:", text.length);
      console.log("📥 Raw AI output preview:", text.substring(0, 500) + "...");

      if (!text || text.trim().length === 0) {
        throw new Error("Empty response from AI");
      }

      const generatedContent = this.parseAndRepairAIResponse(text);

      // Validate required fields for exam
      if (!generatedContent.examContent || !generatedContent.answerKeyContent) {
        console.error(
          "❌ Missing required exam fields:",
          Object.keys(generatedContent)
        );
        throw new Error("Missing required exam content fields in AI response");
      }

      const result_content = {
        examContent: generatedContent.examContent,
        answerKeyContent: generatedContent.answerKeyContent,
      };

      console.log(`✅ Generated exam content analysis:`, {
        examContent: result_content.examContent ? "Generated" : "Missing",
        answerKeyContent: result_content.answerKeyContent
          ? "Generated"
          : "Missing",
        examContentKeys: result_content.examContent
          ? Object.keys(result_content.examContent)
          : [],
      });

      return result_content;
    } catch (error) {
      console.error("❌ Error in generateExam:", error);
      throw error;
    }
  }

  /**
   * Generate content by type - unified method
   */
  async generateByType(activityType, data) {
    console.log(`🎯 Generating content for type: ${activityType}`);

    switch (activityType) {
      case "activity":
      case "activityInClass":
        return await this.generateActivity(data);

      case "essay":
        return await this.generateEssay(data);

      case "textbook":
        return await this.generateTextbook(data);

      case "assessment":
        return await this.generateAssessment(data);

      case "spm-exam":
        return await this.generateExam(data);

      default:
        console.warn(
          `⚠️ Unhandled activity type: ${activityType}, falling back to activity`
        );
        return await this.generateActivity({
          ...data,
          activityType: "activity",
        });
    }
  }
}

module.exports = AssessmentGenerator;
