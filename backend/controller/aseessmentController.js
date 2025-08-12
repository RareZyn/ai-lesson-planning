// Fixed backend/controller/assessmentController.js - Updated to use Gemini and return JSON instead of HTML
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Assessment = require("../model/Assessment");
const LessonPlan = require("../model/Lesson");
const User = require("../model/User");

// Activity type mapping to ensure valid enum values
const ACTIVITY_TYPE_MAPPING = {
  activityInClass: "activity",
  "activity-in-class": "activity",
  activity_in_class: "activity",
  activity: "activity",
  essay: "essay",
  textbook: "textbook",
  assessment: "assessment",
};

// Function to validate and map activity type
const validateAndMapActivityType = (activityType) => {
  if (!activityType) {
    return "activity"; // Default fallback
  }

  const mapped = ACTIVITY_TYPE_MAPPING[activityType.toLowerCase()];
  if (!mapped) {
    console.warn(
      `Unknown activity type "${activityType}", defaulting to "activity"`
    );
    return "activity";
  }

  console.log(`Mapped activity type: "${activityType}" -> "${mapped}"`);
  return mapped;
};

// UPDATED: Structure generated content based on activity type (now expects JSON instead of HTML)
const structureGeneratedContent = (generatedContent, activityType) => {
  console.log("Structuring content for activity type:", activityType);
  console.log("Raw generated content:", Object.keys(generatedContent));

  // Initialize the content structure
  const structuredContent = {
    activityContent: null,
    rubricContent: null,
    assessmentContent: null,
    answerKeyContent: null,
    hasStudentContent: false,
    hasTeacherContent: false,
    generatedAt: new Date(),
  };

  // Map content based on activity type
  switch (activityType) {
    case "assessment":
      // For assessments: student content = assessmentContent, teacher content = answerKeyContent
      structuredContent.assessmentContent =
        generatedContent.assessmentContent || null;
      structuredContent.answerKeyContent =
        generatedContent.answerKeyContent || null;
      structuredContent.hasStudentContent =
        !!generatedContent.assessmentContent;
      structuredContent.hasTeacherContent = !!generatedContent.answerKeyContent;
      console.log("Assessment content structured:", {
        hasAssessmentContent: !!structuredContent.assessmentContent,
        hasAnswerKeyContent: !!structuredContent.answerKeyContent,
      });
      break;

    case "essay":
    case "textbook":
    case "activity":
    default:
      // For other types: student content = activityContent, teacher content = rubricContent
      structuredContent.activityContent =
        generatedContent.activityContent || null;
      structuredContent.rubricContent = generatedContent.rubricContent || null;
      structuredContent.hasStudentContent = !!generatedContent.activityContent;
      structuredContent.hasTeacherContent = !!generatedContent.rubricContent;
      console.log("Activity content structured:", {
        hasActivityContent: !!structuredContent.activityContent,
        hasRubricContent: !!structuredContent.rubricContent,
      });
      break;
  }

  return structuredContent;
};

const generateFromLessonPlan = async (req, res) => {
  try {
    const {
      lessonPlanId,
      classId,
      lesson,
      subject,
      theme,
      topic,
      grade,
      contentStandard,
      learningStandard,
      learningOutline,
      assessmentTitle,
      assessmentDescription,
      activityType: rawActivityType,
      ...activityData
    } = req.body;

    console.log("Received request body:", req.body);

    // Validate and map activity type
    const activityType = validateAndMapActivityType(rawActivityType);
    console.log(
      `Activity type validation: "${rawActivityType}" -> "${activityType}"`
    );

    // Validate required fields
    if (!lessonPlanId || !classId || !lesson || !activityType) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: lessonPlanId, classId, lesson, activityType",
      });
    }

    // Get the user with their Gemini API key
    const user = await User.findById(req.user.id).select("+geminiApiKey");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Get and decrypt the user's Gemini API key
    const geminiApiKey = user.getGeminiApiKey();

    if (!geminiApiKey) {
      return res.status(400).json({
        success: false,
        message:
          "No Gemini API key found. Please add your API key in your profile settings.",
      });
    }

    let generatedContent;

    // Route to appropriate generation function based on activity type
    switch (activityType) {
      case "activity":
        generatedContent = await generateActivityContent({
          contentStandard,
          learningStandard,
          learningOutline,
          lesson,
          subject,
          theme,
          topic,
          activityType: "activity",
          geminiApiKey,
          ...activityData,
        });
        break;

      case "essay":
        generatedContent = await generateEssayContent({
          contentStandard,
          learningStandard,
          learningOutline,
          lesson,
          subject,
          theme,
          topic,
          geminiApiKey,
          ...activityData,
        });
        break;

      case "textbook":
        generatedContent = await generateTextbookContent({
          contentStandard,
          learningStandard,
          learningOutline,
          lesson,
          subject,
          theme,
          topic,
          geminiApiKey,
          ...activityData,
        });
        break;

      case "assessment":
        generatedContent = await generateAssessmentContent({
          contentStandard,
          learningStandard,
          learningOutline,
          lesson,
          subject,
          theme,
          topic,
          geminiApiKey,
          ...activityData,
        });
        break;

      default:
        console.warn(
          `Unhandled activity type: ${activityType}, falling back to activity`
        );
        generatedContent = await generateActivityContent({
          contentStandard,
          learningStandard,
          learningOutline,
          lesson,
          subject,
          theme,
          topic,
          activityType: "activity",
          geminiApiKey,
          ...activityData,
        });
        break;
    }

    console.log("Generated content from AI:", Object.keys(generatedContent));

    // FIXED: Ensure we have the user properly
    if (!req.user) {
      req.user = { id: "test-user-id" };
    }

    // FIXED: Structure the content properly based on activity type
    const structuredContent = structureGeneratedContent(
      generatedContent,
      activityType
    );

    console.log("Creating assessment with data:", {
      title: assessmentTitle || `${lesson} - ${activityType}`,
      activityType,
      lessonPlanId,
      classId,
      createdBy: req.user.id,
      structuredContent,
    });

    // FIXED: Save assessment to database with proper content structure
    const assessmentData = {
      title: assessmentTitle || `${lesson} - ${activityType}`,
      description:
        assessmentDescription || `Generated ${activityType} assessment`,
      createdBy: req.user.id,
      lessonPlanId,
      classId,
      activityType, // Use the validated activity type
      assessmentType: `${activityType
        .charAt(0)
        .toUpperCase()}${activityType.slice(1)} Assessment`,
      questionCount: activityData.numberOfQuestions || 20,
      duration:
        activityData.timeAllocation || activityData.duration || "60 minutes",
      difficulty: "Intermediate",
      skills: [],
      // FIXED: Use the properly structured content
      generatedContent: structuredContent,
      lessonPlanSnapshot: {
        title: lesson,
        subject,
        grade,
        contentStandard,
        learningStandard,
        learningOutline,
      },
      status: "Generated",
      // FIXED: Set proper flags based on content availability and activity type
      hasActivity: structuredContent.hasStudentContent,
      hasRubric: structuredContent.hasTeacherContent,
    };

    console.log("Assessment data to save:", assessmentData);

    const assessment = await Assessment.create(assessmentData);

    console.log("Assessment created successfully:", assessment._id);
    console.log("Saved generatedContent:", assessment.generatedContent);

    // Update lesson plan status
    try {
      await LessonPlan.findByIdAndUpdate(lessonPlanId, {
        assessmentStatus: "generated",
        $push: {
          generatedAssessments: {
            assessmentId: assessment._id,
            activityType: activityType,
            generatedAt: new Date(),
          },
        },
      });
      console.log(`Updated lesson plan ${lessonPlanId} status to generated`);
    } catch (lessonPlanError) {
      console.error("Error updating lesson plan status:", lessonPlanError);
    }

    // FIXED: Return the complete response with all content
    res.status(201).json({
      success: true,
      message: `${activityType} assessment generated and saved successfully`,
      data: assessment,
      generatedContent: assessment.generatedContent, // Include the generated content in response
    });
  } catch (error) {
    console.error("Error in generateFromLessonPlan:", error);

    // Check if it's a Gemini API related error
    if (
      error.message.includes("API_KEY") ||
      error.message.includes("401") ||
      error.message.includes("Invalid API key")
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid Gemini API key. Please check your API key in profile settings.",
      });
    }

    // Check if it's a quota error
    if (error.message.includes("quota") || error.message.includes("429")) {
      return res.status(429).json({
        success: false,
        message:
          "Gemini API quota exceeded. Please try again later or check your API limits.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error generating assessment from lesson plan",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Add method to get lesson plans without assessments
const getLessonPlansWithoutAssessments = async (req, res) => {
  try {
    const LessonPlan = require("../model/Lesson");

    const lessonPlans = await LessonPlan.find({
      createdBy: req.user.id,
      assessmentStatus: { $ne: "generated" },
    })
      .populate("classId", "className grade subject")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: lessonPlans,
    });
  } catch (error) {
    console.error("Error fetching lesson plans without assessments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching lesson plans",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get filtered assessments method
const getUserAssessmentsFiltered = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      classId,
      activityType: rawActivityType,
      status,
      search,
      hasLessonPlan,
    } = req.query;

    // Build filter object
    const filter = { createdBy: req.user.id };

    if (classId) filter.classId = classId;

    // Validate activity type filter
    if (rawActivityType) {
      const mappedActivityType = validateAndMapActivityType(rawActivityType);
      filter.activityType = mappedActivityType;
    }

    if (status) filter.status = status;

    // Filter by lesson plan presence
    if (hasLessonPlan !== undefined) {
      if (hasLessonPlan === "true") {
        filter.lessonPlanId = { $exists: true, $ne: null };
      } else if (hasLessonPlan === "false") {
        filter.$or = [
          { lessonPlanId: { $exists: false } },
          { lessonPlanId: null },
        ];
      }
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { assessmentType: { $regex: search, $options: "i" } },
      ];
    }

    console.log("Assessment filter query:", filter);

    // Execute query with pagination
    const assessments = await Assessment.find(filter)
      .populate({
        path: "lessonPlanId",
        select: "parameters plan",
      })
      .populate({
        path: "classId",
        select: "className grade subject year",
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Assessment.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: assessments.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: assessments,
    });
  } catch (error) {
    console.error("Get filtered assessments error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching assessments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Helper functions for different assessment types - UPDATED to use Gemini and return JSON
const generateActivityContent = async (data) => {
  const genAI = new GoogleGenerativeAI(data.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent(buildActivityPrompt(data));
  const response = await result.response;
  const text = response.text();

  let generatedContent;
  try {
    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    generatedContent = JSON.parse(cleanedText);
  } catch (parseError) {
    console.error("Failed to parse Gemini response as JSON. Raw text:", text);
    throw new Error("The AI response was not in a valid JSON format.");
  }

  // Validate required fields
  if (!generatedContent.activityContent || !generatedContent.rubricContent) {
    throw new Error("Missing required content fields in AI response");
  }

  return {
    activityContent: generatedContent.activityContent,
    rubricContent: generatedContent.rubricContent,
  };
};

const generateEssayContent = async (data) => {
  const genAI = new GoogleGenerativeAI(data.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent(buildEssayPrompt(data));
  const response = await result.response;
  const text = response.text();

  let generatedContent;
  try {
    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    generatedContent = JSON.parse(cleanedText);
  } catch (parseError) {
    console.error("Failed to parse Gemini response as JSON. Raw text:", text);
    throw new Error("The AI response was not in a valid JSON format.");
  }

  return {
    activityContent: generatedContent.activityContent,
    rubricContent: generatedContent.rubricContent,
  };
};

const generateTextbookContent = async (data) => {
  const genAI = new GoogleGenerativeAI(data.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent(buildTextbookPrompt(data));
  const response = await result.response;
  const text = response.text();

  let generatedContent;
  try {
    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    generatedContent = JSON.parse(cleanedText);
  } catch (parseError) {
    console.error("Failed to parse Gemini response as JSON. Raw text:", text);
    throw new Error("The AI response was not in a valid JSON format.");
  }

  return {
    activityContent: generatedContent.activityContent,
    rubricContent: generatedContent.rubricContent,
  };
};

// UPDATED: Assessment content generation - return proper field names and use Gemini
const generateAssessmentContent = async (data) => {
  console.log("Generating assessment content with data:", data);

  const numberOfQuestions = data.numberOfQuestions || 20;
  console.log(`Generating assessment with ${numberOfQuestions} questions`);

  const genAI = new GoogleGenerativeAI(data.geminiApiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.7,
    },
  });

  try {
    const result = await model.generateContent(buildAssessmentPrompt(data));
    const response = await result.response;
    const text = response.text();

    console.log("Raw AI output length:", text.length);
    console.log("Raw AI output preview:", text.substring(0, 500) + "...");

    let generatedContent;
    try {
      const cleanedText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      generatedContent = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON. Raw text:", text);
      throw new Error("The AI response was not in a valid JSON format.");
    }

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
    console.error("Error in generateAssessmentContent:", error);

    // Try one more time with a more explicit prompt if first attempt fails
    if (!error.message.includes("retry")) {
      console.log("Retrying assessment generation with enhanced prompt...");
      return await retryAssessmentGeneration(data, numberOfQuestions);
    }

    throw error;
  }
};

// UPDATED: Retry function for when assessment generation fails
const retryAssessmentGeneration = async (data, numberOfQuestions) => {
  console.log(
    `Retrying assessment generation with emphasis on ${numberOfQuestions} questions`
  );

  const genAI = new GoogleGenerativeAI(data.geminiApiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.5,
    },
  });

  const result = await model.generateContent(
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
    console.error("Retry failed to parse Gemini response. Full output:", text);
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
};

// Helper functions to build prompts - UPDATED to request JSON instead of HTML
const buildActivityPrompt = (data) => {
  return `
# Identity

You are an AI assistant helping to generate creative and pedagogically sound in-class assessments and rubrics for English language teachers based on Malaysian KSSM curriculum lesson plans.

# Instructions

You must generate a JSON response with two main fields:

1. 🎓 Student Activity Content (JSON object)
2. 🧑‍🏫 Teacher Rubric Content (JSON object)

# Lesson Data

{
  "lesson": "${data.lesson}",
  "subject": "${data.subject}",
  "theme": "${data.theme || ""}",
  "topic": "${data.topic || ""}",
  "contentStandard": {
    "main": "${data.contentStandard?.main || ""}",
    "component": "${data.contentStandard?.component || ""}"
  },
  "learningStandard": {
    "main": "${data.learningStandard?.main || ""}",
    "component": "${data.learningStandard?.component || ""}"
  },
  "learningOutline": {
    "pre": "${data.learningOutline?.pre || ""}",
    "during": "${data.learningOutline?.during || ""}",
    "post": "${data.learningOutline?.post || ""}"
  },
  "activityType": "${data.activityType || "activity"}",
  "studentArrangement": "${data.studentArrangement || "small_group"}",
  "resourceUsage": "${data.resourceUsage || "classroom_only"}",
  "duration": "${data.duration || "30-45 minutes"}",
  "additionalRequirement": "${data.additionalRequirement || ""}"
}

# Activity Configuration

Generate an in-class activity that incorporates:
- Student Arrangement: ${data.studentArrangement || "small_group"}
- Resource Usage: ${data.resourceUsage || "classroom_only"}
- Duration: ${data.duration || "30-45 minutes"}
- Additional Requirements: ${
    data.additionalRequirement || "Standard classroom activity"
  }

# Output Format

Return a JSON object with this exact structure:

{
  "activityContent": {
    "title": "Activity Title",
    "description": "Brief description of the activity",
    "duration": "${data.duration || "30-45 minutes"}",
    "materials": ["List", "of", "materials"],
    "instructions": [
      "Step 1: Clear instruction",
      "Step 2: Another instruction",
      "Step 3: Final instruction"
    ],
    "studentInfo": {
      "name": "",
      "class": "",
      "date": ""
    },
    "activities": [
      {
        "section": "Introduction",
        "tasks": ["Task 1", "Task 2"]
      },
      {
        "section": "Main Activity", 
        "tasks": ["Task 1", "Task 2", "Task 3"]
      },
      {
        "section": "Conclusion",
        "tasks": ["Task 1", "Task 2"]
      }
    ]
  },
  "rubricContent": {
    "title": "Assessment Rubric",
    "description": "Rubric for evaluating student performance",
    "criteria": [
      {
        "category": "Content Understanding",
        "excellent": "Clear demonstration of understanding",
        "good": "Good understanding with minor gaps", 
        "satisfactory": "Basic understanding shown",
        "needsImprovement": "Limited understanding evident",
        "points": 5
      },
      {
        "category": "Participation",
        "excellent": "Active participation throughout",
        "good": "Good participation with occasional engagement",
        "satisfactory": "Moderate participation",
        "needsImprovement": "Minimal participation",
        "points": 5
      }
    ],
    "totalPoints": 25,
    "gradingScale": {
      "excellent": "23-25 points",
      "good": "18-22 points", 
      "satisfactory": "13-17 points",
      "needsImprovement": "Below 13 points"
    }
  }
}

Do not include anything else. Just return the clean JSON object.
`;
};

const buildEssayPrompt = (data) => {
  return `
# Identity

You are an AI assistant that creates student essay tasks and teacher grading rubrics based on Malaysian KSSM curriculum lesson plans. All outputs must be in JSON format.

# Instructions

You must return a JSON object with two main fields:

1. 📘 Student Essay Activity Content (JSON object)
2. 🧑‍🏫 Teacher Rubric Content (JSON object)

# Lesson Data

{
  "lesson": "${data.lesson}",
  "subject": "${data.subject}",
  "theme": "${data.theme || ""}",
  "topic": "${data.topic || ""}",
  "contentStandard": {
    "main": "${data.contentStandard?.main || ""}",
    "component": "${data.contentStandard?.component || ""}"
  },
  "learningStandard": {
    "main": "${data.learningStandard?.main || ""}",
    "component": "${data.learningStandard?.component || ""}"
  },
  "learningOutline": {
    "pre": "${data.learningOutline?.pre || ""}",
    "during": "${data.learningOutline?.during || ""}",
    "post": "${data.learningOutline?.post || ""}"
  },
  "essayType": "${data.essayType || "descriptive"}",
  "wordCount": "${data.wordCount || "200-300 words"}",
  "duration": "${data.duration || "60 minutes"}",
  "additionalRequirement": "${data.additionalRequirement || ""}"
}

# Output Format

Return a JSON object with this exact structure:

{
  "activityContent": {
    "title": "Essay Writing Task",
    "essayType": "${data.essayType || "descriptive"}",
    "topic": "Essay topic based on lesson",
    "prompt": "Engaging essay prompt related to the lesson",
    "instructions": [
      "Clear instruction 1",
      "Clear instruction 2",
      "Clear instruction 3"
    ],
    "requirements": {
      "wordCount": "${data.wordCount || "200-300 words"}",
      "duration": "${data.duration || "60 minutes"}",
      "format": "Standard essay format"
    },
    "guidelines": [
      "Use proper grammar and spelling",
      "Organize ideas clearly",
      "Support points with examples"
    ],
    "studentInfo": {
      "name": "",
      "class": "",
      "date": ""
    }
  },
  "rubricContent": {
    "title": "Essay Assessment Rubric",
    "description": "Rubric for evaluating essay performance",
    "criteria": [
      {
        "category": "Content",
        "excellent": "Ideas are clear, well-developed, and relevant",
        "good": "Ideas are clear with good development",
        "satisfactory": "Ideas are present but need more development",
        "needsImprovement": "Ideas are unclear or irrelevant",
        "points": 5
      },
      {
        "category": "Organization",
        "excellent": "Clear structure with logical flow",
        "good": "Good structure with minor issues",
        "satisfactory": "Basic structure present",
        "needsImprovement": "Poor organization",
        "points": 5
      },
      {
        "category": "Language Use",
        "excellent": "Excellent grammar and vocabulary",
        "good": "Good language with minor errors",
        "satisfactory": "Adequate language use",
        "needsImprovement": "Frequent language errors",
        "points": 5
      }
    ],
    "totalPoints": 25,
    "gradingScale": {
      "excellent": "23-25 points",
      "good": "18-22 points",
      "satisfactory": "13-17 points", 
      "needsImprovement": "Below 13 points"
    }
  }
}

Do not include anything else. Just return the clean JSON object.
`;
};

const buildTextbookPrompt = (data) => {
  return `
# Identity

You are an AI assistant that generates textbook-based classroom activities and teacher rubrics based on the Malaysian KSSM curriculum. Return JSON format only.

# Instructions

You must return a JSON object with two main fields:

1. 📘 Student Textbook Activity Content (JSON object)
2. 🧑‍🏫 Teacher Rubric Content (JSON object)

# Lesson Data

{
  "lesson": "${data.lesson}",
  "subject": "${data.subject}",
  "theme": "${data.theme || ""}",
  "topic": "${data.topic || ""}",
  "contentStandard": {
    "main": "${data.contentStandard?.main || ""}",
    "component": "${data.contentStandard?.component || ""}"
  },
  "learningStandard": {
    "main": "${data.learningStandard?.main || ""}",
    "component": "${data.learningStandard?.component || ""}"
  },
  "learningOutline": {
    "pre": "${data.learningOutline?.pre || ""}",
    "during": "${data.learningOutline?.during || ""}",
    "post": "${data.learningOutline?.post || ""}"
  },
  "additionalRequirement": "${data.additionalRequirement || ""}"
}

# Output Format

Return a JSON object with this exact structure:

{
  "activityContent": {
    "title": "Textbook-Based Activity",
    "description": "Activity based on textbook content",
    "textbookReference": {
      "pages": "Pages X-Y",
      "chapter": "Chapter name",
      "section": "Section title"
    },
    "preActivity": [
      "Preview task 1",
      "Preview task 2"
    ],
    "mainActivity": [
      "Main textbook task 1",
      "Main textbook task 2", 
      "Main textbook task 3"
    ],
    "postActivity": [
      "Follow-up task 1",
      "Reflection task 2"
    ],
    "questions": [
      {
        "type": "comprehension",
        "question": "Question based on textbook content"
      },
      {
        "type": "analysis", 
        "question": "Analysis question"
      }
    ],
    "studentInfo": {
      "name": "",
      "class": "",
      "date": ""
    }
  },
  "rubricContent": {
    "title": "Textbook Activity Assessment Rubric",
    "description": "Rubric for evaluating textbook-based activity performance",
    "criteria": [
      {
        "category": "Understanding",
        "excellent": "Clear understanding of textbook content",
        "good": "Good understanding with minor gaps",
        "satisfactory": "Basic understanding shown",
        "needsImprovement": "Limited understanding evident",
        "points": 5
      },
      {
        "category": "Participation",
        "excellent": "Active participation in all activities",
        "good": "Good participation throughout",
        "satisfactory": "Moderate participation",
        "needsImprovement": "Minimal participation",
        "points": 5
      },
      {
        "category": "Communication",
        "excellent": "Clear and effective communication",
        "good": "Good communication skills",
        "satisfactory": "Adequate communication",
        "needsImprovement": "Poor communication",
        "points": 5
      }
    ],
    "totalPoints": 25,
    "gradingScale": {
      "excellent": "23-25 points",
      "good": "18-22 points",
      "satisfactory": "13-17 points",
      "needsImprovement": "Below 13 points"
    }
  }
}

Do not include anything else. Just return the clean JSON object.
`;
};

// UPDATED: Assessment prompt to generate JSON content
const buildAssessmentPrompt = (data) => {
  const numberOfQuestions = data.numberOfQuestions || 20;
  const questionTypes = Array.isArray(data.questionTypes)
    ? data.questionTypes.join(", ")
    : data.questionTypes || "multiple_choice, short_answer";

  return `
# CRITICAL REQUIREMENT: Generate EXACTLY ${numberOfQuestions} questions

You must create a complete English assessment with exactly ${numberOfQuestions} questions based on the lesson "${
    data.lesson || "English Lesson"
  }" and return it in JSON format.

## Assessment Details:
- Subject: ${data.subject || "English"}  
- Topic: ${data.lesson || "General English"}
- Grade Level: ${data.grade || "Form 4"}
- Number of Questions: **${numberOfQuestions}** (MANDATORY - DO NOT GENERATE LESS)
- Time Allocation: ${data.timeAllocation || "60 minutes"}
- Question Types: ${questionTypes}

## Lesson Context:
- Theme: ${data.theme || ""}
- Specific Topic: ${data.topic || ""}
- Content Standard: ${data.contentStandard?.main || ""}
- Learning Standard: ${data.learningStandard?.main || ""}

## Question Requirements:
1. Generate ALL ${numberOfQuestions} questions - do not stop early
2. Number each question clearly (1, 2, 3, ... ${numberOfQuestions})
3. Mix question types: ${questionTypes}
4. Base questions on the lesson content
5. Include appropriate difficulty for ${data.grade || "Form 4"}

## Output Requirements:

Generate a JSON object with this exact structure:

{
  "assessmentContent": {
    "title": "${data.lesson || "English Assessment"}",
    "subject": "${data.subject || "English"}",
    "timeAllocation": "${data.timeAllocation || "60 minutes"}",
    "totalQuestions": ${numberOfQuestions},
    "instructions": [
      "Read all questions carefully before answering",
      "Answer ALL ${numberOfQuestions} questions",
      "Write clearly and legibly",
      "Manage your time wisely"
    ],
    "studentInfo": {
      "name": "",
      "class": "",
      "date": ""
    },
    "questions": [
      {
        "questionNumber": 1,
        "type": "multiple_choice",
        "question": "Question text here",
        "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
        "points": 2
      },
      {
        "questionNumber": 2,
        "type": "short_answer",
        "question": "Question text here",
        "answerSpace": "3 lines",
        "points": 5
      }
    ]
  },
  "answerKeyContent": {
    "title": "ANSWER KEY - ${data.lesson || "English Assessment"}",
    "totalQuestions": ${numberOfQuestions},
    "totalPoints": "Calculate based on questions",
    "answers": [
      {
        "questionNumber": 1,
        "correctAnswer": "B) Option 2",
        "points": 2,
        "markingNotes": "Accept equivalent answers"
      },
      {
        "questionNumber": 2,
        "correctAnswer": "Sample correct answer",
        "points": 5,
        "markingNotes": "Look for key points: point1, point2, point3"
      }
    ],
    "gradingScale": {
      "excellent": "90-100%",
      "good": "75-89%",
      "satisfactory": "60-74%",
      "needsImprovement": "Below 60%"
    }
  }
}

Remember: You MUST generate exactly ${numberOfQuestions} questions in the questions array. Count them as you write to ensure you reach the required number.
`;
};

// UPDATED: Enhanced prompt for retry attempts
const buildEnhancedAssessmentPrompt = (data, numberOfQuestions) => {
  return `
# URGENT: Generate EXACTLY ${numberOfQuestions} Questions

This is a retry because the previous attempt didn't generate enough questions.

YOU MUST CREATE ALL ${numberOfQuestions} QUESTIONS. Here's the checklist:
□ Question 1
□ Question 2  
□ Question 3
${Array.from(
  { length: numberOfQuestions - 3 },
  (_, i) => `□ Question ${i + 4}`
).join("\n")}

## Requirements:
- Topic: ${data.lesson || "English Lesson"}
- Grade: ${data.grade || "Form 4"}
- Question Types: ${
    Array.isArray(data.questionTypes) ? data.questionTypes.join(", ") : "mixed"
  }

## Template Structure:
Generate a JSON object with assessmentContent containing ALL ${numberOfQuestions} questions and answerKeyContent with answers to ALL ${numberOfQuestions} questions.

Structure:
{
  "assessmentContent": {
    "title": "${data.lesson || "English Assessment"}",
    "totalQuestions": ${numberOfQuestions},
    "questions": [
      // ALL ${numberOfQuestions} questions here
    ]
  },
  "answerKeyContent": {
    "title": "Answer Key",
    "answers": [
      // Answers for ALL ${numberOfQuestions} questions here  
    ]
  }
}

DO NOT STOP until you have written Question ${numberOfQuestions}!
`;
};

const saveAssessment = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found in request.",
      });
    }

    const {
      title,
      description,
      lessonPlanId,
      classId,
      activityType: rawActivityType,
      assessmentType,
      questionCount,
      duration,
      difficulty,
      skills,
      generatedContent,
      lessonPlanSnapshot,
      tags,
      notes,
    } = req.body;

    // Validate and map activity type
    const activityType = validateAndMapActivityType(rawActivityType);

    // Validation
    if (!title || !lessonPlanId || !classId || !activityType) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: title, lessonPlanId, classId, activityType",
      });
    }

    // Create assessment
    const assessment = await Assessment.create({
      title,
      description,
      createdBy: req.user.id,
      lessonPlanId,
      classId,
      activityType, // Use validated activity type
      assessmentType: assessmentType || "General Assessment",
      questionCount: questionCount || 20,
      duration: duration || "60 minutes",
      difficulty: difficulty || "Intermediate",
      skills: skills || [],
      generatedContent: generatedContent || {},
      lessonPlanSnapshot: lessonPlanSnapshot || {},
      tags: tags || [],
      notes: notes || "",
      status: generatedContent ? "Generated" : "Draft",
      hasActivity: !!(
        generatedContent &&
        (generatedContent.activityContent || generatedContent.assessmentContent)
      ),
      hasRubric: !!(
        generatedContent &&
        (generatedContent.rubricContent || generatedContent.answerKeyContent)
      ),
    });

    // Populate the response
    const populatedAssessment = await Assessment.findById(assessment._id)
      .populate("lessonPlanId", "parameters plan")
      .populate("classId", "className grade subject")
      .populate("createdBy", "name");

    res.status(201).json({
      success: true,
      message: "Assessment saved successfully",
      data: populatedAssessment,
    });
  } catch (error) {
    console.error("Save assessment error:", error);
    res.status(500).json({
      success: false,
      message: "Error saving assessment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get user's assessments with filtering
 * @route   GET /api/assessment/my-assessments
 * @access  Private
 */
const getUserAssessments = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found in request.",
      });
    }

    const {
      page = 1,
      limit = 10,
      classId,
      activityType: rawActivityType,
      status,
      search,
    } = req.query;

    // Build filter object
    const filter = { createdBy: req.user.id };

    if (classId) filter.classId = classId;

    // Validate activity type filter
    if (rawActivityType) {
      const mappedActivityType = validateAndMapActivityType(rawActivityType);
      filter.activityType = mappedActivityType;
    }

    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { assessmentType: { $regex: search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const assessments = await Assessment.find(filter)
      .populate({
        path: "lessonPlanId",
        select: "parameters plan",
      })
      .populate({
        path: "classId",
        select: "className grade subject year",
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Assessment.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: assessments.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: assessments,
    });
  } catch (error) {
    console.error("Get user assessments error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching assessments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get assessment by ID
 * @route   GET /api/assessment/:id
 * @access  Private
 */
const getAssessmentById = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found in request.",
      });
    }

    const assessment = await Assessment.findById(req.params.id)
      .populate({
        path: "lessonPlanId",
        select: "parameters plan",
      })
      .populate({
        path: "classId",
        select: "className grade subject year",
      })
      .populate({
        path: "createdBy",
        select: "name",
      });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }

    // Check if user owns this assessment
    if (assessment.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this assessment",
      });
    }

    console.log("Returning assessment:", {
      id: assessment._id,
      generatedContent: assessment.generatedContent,
      hasActivity: assessment.hasActivity,
      hasRubric: assessment.hasRubric,
    });

    res.status(200).json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    console.error("Get assessment by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching assessment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Delete assessment
 * @route   DELETE /api/assessment/:id
 * @access  Private
 */
const deleteAssessment = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found in request.",
      });
    }

    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }

    // Check if user owns this assessment
    if (assessment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this assessment",
      });
    }

    // Also update the lesson plan status when deleting assessment
    if (assessment.lessonPlanId) {
      try {
        // Check if this is the only assessment for this lesson plan
        const otherAssessments = await Assessment.countDocuments({
          lessonPlanId: assessment.lessonPlanId,
          _id: { $ne: assessment._id },
        });

        if (otherAssessments === 0) {
          // If this is the only assessment, update lesson plan status back to not_generated
          await LessonPlan.findByIdAndUpdate(assessment.lessonPlanId, {
            assessmentStatus: "not_generated",
            $pull: {
              generatedAssessments: { assessmentId: assessment._id },
            },
          });
        } else {
          // Just remove this assessment from the array
          await LessonPlan.findByIdAndUpdate(assessment.lessonPlanId, {
            $pull: {
              generatedAssessments: { assessmentId: assessment._id },
            },
          });
        }
      } catch (lessonPlanError) {
        console.error(
          "Error updating lesson plan after deletion:",
          lessonPlanError
        );
      }
    }

    await assessment.deleteOne();

    res.status(200).json({
      success: true,
      message: "Assessment deleted successfully",
      data: {},
    });
  } catch (error) {
    console.error("Delete assessment error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting assessment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Update assessment status and generated content
 * @route   PUT /api/assessment/:id
 * @access  Private
 */
const updateAssessment = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found in request.",
      });
    }

    const {
      title,
      description,
      generatedContent,
      status,
      hasActivity,
      hasRubric,
      notes,
      tags,
      activityType: rawActivityType,
    } = req.body;

    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }

    // Check if user owns this assessment
    if (assessment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this assessment",
      });
    }

    // Update fields
    if (title) assessment.title = title;
    if (description) assessment.description = description;
    if (generatedContent) assessment.generatedContent = generatedContent;
    if (status) assessment.status = status;
    if (hasActivity !== undefined) assessment.hasActivity = hasActivity;
    if (hasRubric !== undefined) assessment.hasRubric = hasRubric;
    if (notes) assessment.notes = notes;
    if (tags) assessment.tags = tags;

    // Validate activity type if provided
    if (rawActivityType) {
      assessment.activityType = validateAndMapActivityType(rawActivityType);
    }

    // Update usage tracking
    assessment.usageCount += 1;
    assessment.lastUsed = new Date();

    await assessment.save();

    // Return populated assessment
    const updatedAssessment = await Assessment.findById(assessment._id)
      .populate("lessonPlanId", "parameters plan")
      .populate("classId", "className grade subject")
      .populate("createdBy", "name");

    res.status(200).json({
      success: true,
      message: "Assessment updated successfully",
      data: updatedAssessment,
    });
  } catch (error) {
    console.error("Update assessment error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating assessment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  generateFromLessonPlan,
  saveAssessment,
  getUserAssessments,
  getAssessmentById,
  deleteAssessment,
  updateAssessment,
  getLessonPlansWithoutAssessments,
  getUserAssessmentsFiltered,
};
