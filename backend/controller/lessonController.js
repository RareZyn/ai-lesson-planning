const { GoogleGenerativeAI } = require("@google/generative-ai");
const LessonPlan = require("../model/Lesson");
const User = require("../model/User");
const { lessonPlanValidationSchema } = require("../utils/validationSchema");

exports.createLesson = async (req, res, next) => {
  try {
    const {
      classId,
      sow,
      proficiencyLevel,
      activityType,
      activityConfiguration,
      hotsFocus,
      specificTopic,
      grade,
      additionalNotes,
    } = req.body;

    if (
      !classId ||
      !sow ||
      !proficiencyLevel ||
      !activityType ||
      !hotsFocus ||
      !specificTopic ||
      !grade
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for lesson plan generation.",
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

    // Initialize Gemini with the user's API key
    const genAI = new GoogleGenerativeAI(geminiApiKey);

    // --- The prompt remains the same ---
    const prompt = `
      You are a Malaysia Educator. Your task is to create a lesson plan tally to Scheme of Work (SoW), You may be creative, engaging 60-minute lesson plan for a ${grade} class.

      Here is the official SoW data to base the plan on:
      ${JSON.stringify(sow, null, 2)}

      Use this specific context provided by the teacher:
      - Class Proficiency Level: ${proficiencyLevel}
      - Specific Topic/Theme: "${specificTopic}"
      - Higher Order Thinking Skill (HOTS) to focus on: ${hotsFocus}
      - Additional Notes: ${additionalNotes || "None"}
      - Type of Activity: ${activityType}
      ${activityConfiguration
        ? `- Activity Configuration: ${JSON.stringify(
          activityConfiguration,
          null,
          2
        )}`
        : ""
      }

      Generate a creative and practical lesson plan based on the SoW's learning outline.
      Do not include any formal assessment, homework and specific materials or resources (Activities from textbook etc).

      The response MUST be a valid JSON object, without any surrounding text or markdown.

      The JSON object must have the following keys:
      - "learningObjective": A single, clear, measurable learning objective.
      - "successCriteria": An array of 3-4 specific "I can..." statements for students.
      - "activities": An object with three keys: "preLesson", "duringLesson", and "postLesson" each key may have array of multiple activity in class.

      **CRITICAL FORMATTING RULE:**
      The value for "preLesson", "duringLesson", and "postLesson" MUST be a simple array of STRINGS. Each string in the array should be a complete sentence describing one activity.
      **DO NOT use objects with keys like 'activityName' or 'description' inside these arrays.**

      The ONLY acceptable format for the 'activities' object is shown in this example:
      {
        "learningObjective": "By the end of the lesson, students will be able to...",
        "successCriteria": [
          "I can identify the main idea of the text.",
          "I can use context clues to understand new vocabulary."
        ],
        "activities": {
          "preLesson": [
            "Teacher holds a 'Word Cloud' brainstorming session on the whiteboard to activate prior knowledge about the topic.",
            "Students work in pairs to predict what the lesson text will be about based on the title and images."
          ],
          "duringLesson": [
            "Students read the text silently for the first time to get the general idea.",
            "Teacher leads a guided reading, pausing at key points to ask comprehension questions.",
            "In small groups, students complete a 'vocabulary hunt' worksheet to find and define key terms from the text."
          ],
          "postLesson": [
            "Students complete an 'Exit Ticket' by writing one sentence summarizing the main takeaway from the lesson."
          ]
        }
      }
    `;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      let generatedPlan;
      try {
        const cleanedText = text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        generatedPlan = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error(
          "Failed to parse Gemini response as JSON. Raw text:",
          text
        );
        throw new Error("The AI response was not in a valid JSON format.");
      }

      console.log("Generated Lesson Plan:", generatedPlan);
      // --- NEW: VALIDATION STEP ---
      const { error, value } =
        lessonPlanValidationSchema.validate(generatedPlan);

      if (error) {
        // If validation fails, log the details and throw a specific error.
        console.error("Joi Validation Error:", error.details);
        // The error message will be something like "Success criteria are required."
        throw new Error(
          `AI response failed validation: ${error.details[0].message}`
        );
      }
      // --- END OF VALIDATION STEP ---

      // If validation passes, 'value' is the validated (and potentially type-coerced) data.
      // It's good practice to use 'value' from here on.
      res.status(200).json({
        success: true,
        data: value,
      });
    } catch (geminiError) {
      console.error("Gemini AI generation error:", geminiError.message);

      // Check if it's an API key related error
      if (
        geminiError.message.includes("API_KEY") ||
        geminiError.message.includes("401") ||
        geminiError.message.includes("Invalid API key")
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid Gemini API key. Please check your API key in profile settings.",
        });
      }

      // Check if it's a quota error
      if (
        geminiError.message.includes("quota") ||
        geminiError.message.includes("429")
      ) {
        return res.status(429).json({
          success: false,
          message:
            "Gemini API quota exceeded. Please try again later or check your API limits.",
        });
      }

      throw geminiError;
    }
  } catch (error) {
    console.error("Lesson generation error:", error.message);
    res.status(500).json({
      success: false,
      message:
        error.message || "An error occurred while generating the lesson plan.",
    });
  }
};

// @desc    Get all lessons
// @access  Private (Admin/Teacher)
exports.getLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find().populate("createdBy", "name");
    return res.status(200).json({
      success: true,
      data: lessons,
    });
  } catch (err) {
    console.error("Error getting lessons:", err);
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/**
 * @desc    Save a new, user-confirmed lesson plan
 * @route   POST /api/lessons
 * @access  Private
 */
exports.saveLessonPlan = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;

    // The classId is inside the parameters object
    const classId = req.body.parameters?.classId;
    if (!classId) {
      return res.status(400).json({
        success: false,
        message: "Class ID is missing in parameters.",
      });
    }

    // Create a new lesson plan document in the database
    const lessonPlan = await LessonPlan.create({
      createdBy: req.body.createdBy,
      classId: classId,
      lessonDate: req.body.date,
      parameters: req.body.parameters,
      plan: req.body.plan,
    });

    res.status(201).json({
      success: true,
      message: "Lesson plan saved successfully!",
      data: lessonPlan, // Return the newly created document
    });
  } catch (error) {
    console.error("Error saving lesson plan:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while saving the lesson plan.",
    });
  }
};

/**
 * @desc    Get a single lesson plan by its ID
 * @route   GET /api/lessons/:id
 * @access  Private
 */
exports.getLessonPlanById = async (req, res, next) => {
  try {
    const lessonPlan = await LessonPlan.findById(req.params.id).populate(
      "classId",
      "className grade"
    ); // Optional: get class name and grade

    if (!lessonPlan) {
      return res.status(404).json({
        success: false,
        message: `Lesson plan not found with id of ${req.params.id}`,
      });
    }

    // Optional: Check if the user is authorized to view this plan
    if (lessonPlan.createdBy.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to view this lesson plan",
      });
    }

    res.status(200).json({
      success: true,
      data: lessonPlan,
    });
  } catch (error) {
    console.error("Error getting lesson plan:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving the lesson plan.",
    });
  }
};

/**
 * @desc    Update an existing lesson plan (specifically the 'plan' part)
 * @route   PUT /api/lessons/:id
 * @access  Private
 */
exports.updateLessonPlan = async (req, res, next) => {
  try {
    let lessonPlan = await LessonPlan.findById(req.params.id);

    if (!lessonPlan) {
      return res.status(404).json({
        success: false,
        message: `Lesson plan not found with id of ${req.params.id}`,
      });
    }

    // Make sure user is the lesson plan owner
    if (lessonPlan.createdBy.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to update this lesson plan",
      });
    }

    // We only allow the 'plan' field to be updated.
    // This prevents accidental changes to parameters, classId, etc.
    lessonPlan.plan = req.body.plan;
    await lessonPlan.save();

    res.status(200).json({ success: true, data: lessonPlan });
  } catch (error) {
    console.error("Error updating lesson plan:", error);
    next(error);
  }
};
/**
 * @desc    Delete a lesson plan by its ID
 * @route   DELETE /api/lessons/:id
 * @access  Private
 */
exports.deleteLessonPlan = async (req, res, next) => {
  try {
    const lessonPlan = await LessonPlan.findById(req.params.id);

    if (!lessonPlan) {
      return res.status(404).json({
        success: false,
        message: `Lesson plan not found with id of ${req.params.id}`,
      });
    }

    // Make sure user is the lesson plan owner
    if (lessonPlan.createdBy.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to delete this lesson plan",
      });
    }

    // In Mongoose 6+, 'remove()' is deprecated. Use 'deleteOne()'.
    await lessonPlan.deleteOne();

    res.status(200).json({
      success: true,
      data: {}, // Return an empty object on successful deletion
    });
  } catch (error) {
    console.error("Error in deleteLessonPlan:", error);
    next(error);
  }
};

/**
 * @desc    Get all lesson plans created by the logged-in user
 * @route   GET /api/lessons
 * @access  Private
 */
exports.getAllUserLessonPlans = async (req, res, next) => {
  try {
    const lessonPlans = await LessonPlan.find({ createdBy: req.user.id })
      .populate({
        path: "classId",
        select: "className subject grade", // Add 'grade' here
      })
      .sort({ lessonDate: -1 });

    console.log(
      `Fetched ${lessonPlans.length} lesson plans for user ${req.user.id}`
    );
    res.status(200).json({
      success: true,
      count: lessonPlans.length,
      data: lessonPlans,
    });
  } catch (error) {
    console.error("Error fetching user's lesson plans:", error);
    next(error);
  }
};

/**
 * @desc    Get the 5 most recently updated lesson plans for the user
 * @route   GET /api/lessons/recent
 * @access  Private
 */
exports.getRecentLessonPlans = async (req, res, next) => {
  try {
    const lessonPlans = await LessonPlan.find({ createdBy: req.user.id })
      .populate({
        path: "classId",
        select: "className subject grade", // Add 'grade' here
      })
      .sort({ updatedAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      count: lessonPlans.length,
      data: lessonPlans,
    });
  } catch (error) {
    console.error("Error fetching recent lesson plans:", error);
    next(error);
  }
};

/**
 * @desc    Get all lesson plans for a specific class
 * @route   GET /api/lessons/by-class/:classId
 * @access  Private
 */
exports.getLessonPlansByClass = async (req, res, next) => {
  try {
    const { classId } = req.params;

    const lessonPlans = await LessonPlan.find({
      createdBy: req.user.id,
      classId: classId,
    })
      .populate({
        path: "classId",
        select: "className subject grade", // Add 'grade' here
      })
      .sort({ lessonDate: -1 });

    res.status(200).json({
      success: true,
      count: lessonPlans.length,
      data: lessonPlans,
    });
  } catch (error) {
    console.error("Error fetching lesson plans by class:", error);
    next(error);
  }
};

// Add this new function to your lessonController.js

/**
 * @desc    Enhance a specific section of a lesson plan using AI
 * @route   POST /api/lessons/enhance
 * @access  Private
 */
exports.enhanceLessonSection = async (req, res, next) => {
  try {
    const { sectionKey, currentContent, userPrompt, context } = req.body;

    // 1. --- Validate Input ---
    if (!sectionKey || !currentContent || !userPrompt || !context) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for enhancement.",
      });
    }

    // 2. --- Get User and Gemini API Key (Same as createLesson) ---
    const user = await User.findById(req.user.id).select("+geminiApiKey");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    const geminiApiKey = user.getGeminiApiKey();
    if (!geminiApiKey) {
      return res.status(400).json({
        success: false,
        message: "No Gemini API key found. Please add your API key in your profile settings.",
      });
    }
    const genAI = new GoogleGenerativeAI(geminiApiKey);

    // 3. --- Craft the Enhancement Prompt ---
    const isArray = Array.isArray(currentContent);
    const outputFormatInstruction = isArray
      ? 'The response MUST be a valid JSON array of strings. Example: ["New item 1.", "New item 2."]'
      : 'The response MUST be a single JSON string. Example: "This is the new, enhanced content."';

    const prompt = `
      You are an expert curriculum designer and teacher's assistant. Your task is to refine and enhance a specific section of an existing lesson plan based on a teacher's request.

      Here is the context for the lesson:
      - Grade: ${context.grade || "Not specified"}
      - Subject: ${context.subject || "Not specified"}
      - Topic: ${context.topic || "Not specified"}

      Here is the section you need to enhance:
      - Section Name: "${sectionKey}"
      - Current Content of the Section:
      ${JSON.stringify(currentContent, null, 2)}

      Here is the teacher's instruction for enhancement:
      - Teacher's Request: "${userPrompt}"

      Based on the teacher's request, rewrite and improve the "Current Content".

      **CRITICAL OUTPUT RULES:**
      1. The format of your response MUST exactly match the format of the "Current Content".
      2. ${outputFormatInstruction}
      3. Do NOT include any surrounding text, explanations, or markdown like \`\`\`json. Your entire response must be ONLY the raw JSON content itself.
    `;

    // 4. --- Call Gemini and Process Response ---
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      let enhancedContent;
      try {
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        enhancedContent = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error("Failed to parse Gemini response for enhancement. Raw text:", text);
        throw new Error("The AI enhancement response was not in a valid format.");
      }

      // Basic type validation
      if (Array.isArray(currentContent) && !Array.isArray(enhancedContent)) {
        throw new Error("AI response format mismatch: Expected an array.");
      }
      if (!Array.isArray(currentContent) && typeof enhancedContent !== 'string') {
        throw new Error("AI response format mismatch: Expected a string.");
      }

      res.status(200).json({
        success: true,
        enhancedContent: enhancedContent,
      });
    } catch (geminiError) {
      console.error("Gemini AI enhancement error:", geminiError.message);
      // Re-use the detailed error handling from your createLesson function
      if (geminiError.message.includes("API_KEY") || geminiError.message.includes("401")) {
        return res.status(401).json({ success: false, message: "Invalid Gemini API key. Please check your API key in profile settings." });
      }
      if (geminiError.message.includes("quota") || geminiError.message.includes("429")) {
        return res.status(429).json({ success: false, message: "Gemini API quota exceeded. Please try again later." });
      }
      throw geminiError;
    }
  } catch (error) {
    console.error("Enhancement controller error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred during the enhancement process.",
    });
  }
};