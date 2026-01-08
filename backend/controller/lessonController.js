const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require("mongoose");
const LessonPlan = require("../model/Lesson");
const User = require("../model/User");
const Class = require("../model/Class");
const Assessment = require("../model/Assessment");
const StudentAnswer = require("../model/StudentAnswer");
const { lessonPlanValidationSchema } = require("../utils/validationSchema");

// --- HELPER FUNCTIONS ---

/**
 * Helper function to check for conditional GET request (If-Modified-Since).
 * Checks the User's updatedAt timestamp for collection modification status.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {string} userId - ID of the current user
 * @returns {Promise<string|null>} Returns the lastModified UTC string if modified, or null if 304 response was sent.
 */
const checkIfDataModified = async (req, res, userId) => {
  // 1. Find the User's latest modification time
  const user = await User.findById(userId)
    .select('updatedAt')
    .lean()
    .read('primary'); // Ensures a fresh read

  const lastModified = user ? user.updatedAt.toUTCString() : null;

  // 2. Check the client's cache header
  const ifModifiedSince = req.header('if-modified-since');

  // --- DEBUG LOGS ---
  console.log(`[Cache Check] Route: ${req.path}`);
  console.log(`[Cache Check] Server Last Modified: ${lastModified}`);
  console.log(`[Cache Check] Client If-Modified-Since: ${ifModifiedSince}`);
  // --- END DEBUG LOGS ---

  if (lastModified && ifModifiedSince) {
    const serverTime = new Date(lastModified).getTime();
    const clientTime = new Date(ifModifiedSince).getTime();

    // --- DEBUG LOG ---
    console.log(`[Cache Check] Comparison: Server (${serverTime}) vs Client (${clientTime})`);
    // --- END DEBUG LOG ---

    // If the server's update time is <= client's timestamp, the data is not modified
    if (serverTime <= clientTime) {
      console.log(`Sending 304 Not Modified for list view.`);
      res.setHeader('Last-Modified', lastModified);
      res.status(304).send();
      return null;
    }
  }

  // 3. If modified or no header, set the header for the upcoming 200 OK response
  if (lastModified) {
    res.setHeader('Last-Modified', lastModified);
  }

  return lastModified;
};

/**
 * Handles common Gemini API key and quota errors.
 * @param {object} res - Express response object
 * @param {Error} error - The error object
 * @returns {boolean} True if an error response was sent, false otherwise.
 */
const handleGeminiApiError = (res, error) => {
  if (
    error.message.includes("API_KEY") ||
    error.message.includes("401") ||
    error.message.includes("Invalid API key")
  ) {
    res.status(401).json({
      success: false,
      message: "Invalid Gemini API key. Please check your API key in profile settings.",
    });
    return true;
  }

  if (
    error.message.includes("quota") ||
    error.message.includes("429")
  ) {
    res.status(429).json({
      success: false,
      message: "Gemini API quota exceeded. Please try again later or check your API limits.",
    });
    return true;
  }
  return false;
};

// --- CONTROLLER FUNCTIONS ---

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

    // Fetch Class details to get the subject EARLY for validation
    const classDetails = await Class.findById(classId);
    if (!classDetails) {
      return res.status(404).json({ success: false, message: "Class not found for the provided classId." });
    }
    const subject = classDetails.subject ? classDetails.subject.toLowerCase() : "";
    const isEnglish = subject.includes("english");


    // 1. Validate BASIC required fields (always required)
    if (!classId || !sow || !specificTopic || !grade) {
      return res.status(400).json({
        success: false,
        message: "Missing basic required fields (Class, Topic, specificTopic, Grade).",
      });
    }

    // 2. Validate CONDITIONAL fields (Only required for English)
    if (isEnglish) {
      if (!proficiencyLevel || !activityType || !hotsFocus) {
        return res.status(400).json({
          success: false,
          message: "For English subjects, 'Activity Format', 'Proficiency Level', and 'HOTS Focus' are required.",
        });
      }
    }

    const user = await User.findById(req.user.id).select("+geminiApiKey");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // subject variable is already fetched above
    // const classDetails = await Class.findById(classId); <-- Removed redundant fetch
    // const subject = classDetails ? classDetails.subject : "the specified subject"; <-- Removed redundant fetch


    const geminiApiKey = user.getGeminiApiKey();

    if (!geminiApiKey) {
      return res.status(400).json({
        success: false,
        message: "No Gemini API key found. Please add your API key in your profile settings.",
      });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);

    // Check for material usage
    let materialPart = null;
    let materialContent = "";

    if (req.body.materialId) {
      const Material = require("../model/Material");
      // Explicitly select originalFileUrl because it might be set to select: false
      const material = await Material.findById(req.body.materialId).select("+originalFileUrl");

      if (material) {
        if (material.type === "link") {
          // For links, we might still reference the content field if you had scraper logic, 
          // but assuming "link" type materials store URL in originalFileUrl or name.
          materialContent = `Material Link: ${material.originalFileUrl || material.name}`;
        } else if (material.originalFileUrl && material.originalFileUrl.startsWith("data:")) {
          // It's a Base64 file
          const matches = material.originalFileUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            materialPart = {
              inlineData: {
                mimeType: matches[1],
                data: matches[2]
              }
            };
          }
        } else if (material.content) {
          // Fallback to text content if available
          materialContent = material.content;
        }
      }
    }

    // --- The prompt remains the same ---
    // --- The prompt creation ---
    let promptContext = `
      You are a Malaysia Educator. Your task is to create a lesson plan tally to Scheme of Work (SoW), You may be creative, engaging 60-minute lesson plan for a ${grade} class for the subject: ${subject}.
    `;

    // 1. Material & SOW Logic
    if (materialPart || materialContent) {
      promptContext += `
      IMPORTANT: Base your lesson plan primarily on the provided material (attached document or text context).
      
      ${materialContent ? `--- MATERIAL CONTEXT ---\n${materialContent}\n--- END MATERIAL CONTEXT ---` : ""}
      
      You should still align it with the SoW topic if provided below, but prioritize the material content.
      SOW/Curriculum Context (for alignment only):
      ${JSON.stringify(sow, null, 2)}
      `;
    } else {
      promptContext += `
      Here is the official SoW data to base the plan on:
      ${JSON.stringify(sow, null, 2)}
      `;
    }

    // 2. Dynamic Parameters
    promptContext += `
      Use this specific context provided by the teacher:
      - Specific Topic/Theme: "${specificTopic}"
      - Type of Activity: ${activityType}
      - Additional Notes: ${additionalNotes || "None"}
    `;

    // Conditionally add optional fields
    if (proficiencyLevel) promptContext += `\n      - proficiency Level: ${proficiencyLevel}`;
    if (hotsFocus) promptContext += `\n      - Higher Order Thinking Skills (HOTS): ${hotsFocus}`;

    promptContext += `
      ${activityConfiguration
        ? `- Activity Configuration: ${JSON.stringify(activityConfiguration, null, 2)}`
        : ""
      }

      Generate a creative and practical lesson plan based on the SoW's learning outline and the material provided (if any).
      Do not include any formal assessment, homework and specific materials or resources (Activities from textbook etc).

      The response MUST be a valid JSON object, without any surrounding text or markdown.

      The JSON object must have the following keys:
      - "learningObjective": A single, clear, measurable learning objective.
      - "successCriteria": An array of 3-4 specific "I can..." statements for students.
      - "activities": An object with three keys: "preLesson", "duringLesson", and "postLesson" each key may have array of multiple activity in class.

      **CRITICAL FORMATTING RULE:**
      The value for "preLesson", "duringLesson", and "postLesson" MUST be a simple array of STRINGS. Each string in the array should be a complete sentence describing one activity.
      **DO NOT use objects with keys like 'activityName' or 'description' inside these arrays.**

      The ONLY acceptable format for the 'activities' object is shown in this example (Adapt content for ${subject}):
      {
        "learningObjective": "By the end of the lesson, students will be able to...",
        "successCriteria": [
          "I can...",
          "I can..."
        ],
        "activities": {
          "preLesson": [
            "Teacher introduces the topic...",
            "Students..."
          ],
          "duringLesson": [
            "Activity 1...",
            "Activity 2..."
          ],
          "postLesson": [
            "Closure activity..."
          ]
        }
      }
    `;

    const prompt = promptContext;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      // Construct the generation request
      const generateRequest = [prompt];
      if (materialPart) {
        generateRequest.push(materialPart);
      }

      const result = await model.generateContent(generateRequest);
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
        console.error("Failed to parse Gemini response as JSON. Raw text:", text);
        throw new Error("The AI response was not in a valid JSON format.");
      }

      const { error, value } = lessonPlanValidationSchema.validate(generatedPlan);

      if (error) {
        console.error("Joi Validation Error:", error.details);
        throw new Error(`AI response failed validation: ${error.details[0].message}`);
      }

      res.status(200).json({ success: true, data: value });

    } catch (geminiError) {
      console.error("Gemini AI generation error:", geminiError.message);
      if (handleGeminiApiError(res, geminiError)) return;
      throw geminiError;
    }
  } catch (error) {
    console.error("Lesson generation error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred while generating the lesson plan.",
    });
  }
};

// @desc    Get all lessons (Admin/Internal use - Scoped to School)
// @access  Private (Admin/Teacher)
exports.getLessons = async (req, res) => {
  try {
    // Get the requesting user's schoolId for isolation
    const currentUser = await User.findById(req.user.id).select("schoolId").lean();
    if (!currentUser || !currentUser.schoolId) {
      return res.status(400).json({ success: false, message: "User has no associated school." });
    }

    // Find all users in the same school to filter lessons by their IDs
    const schoolUsers = await User.find({ schoolId: currentUser.schoolId }).select("_id").lean();
    const schoolUserIds = schoolUsers.map(u => u._id);

    const lessons = await LessonPlan.find({ createdBy: { $in: schoolUserIds } }).populate("createdBy", "name");
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
 * @route   POST /api/lessons/save
 * @access  Private
 */
exports.saveLessonPlan = async (req, res, next) => {
  try {
    const userId = req.user.id;
    req.body.createdBy = userId;

    const classId = req.body.parameters?.classId;
    if (!classId) {
      return res.status(400).json({
        success: false,
        message: "Class ID is missing in parameters.",
      });
    }

    // Execute creation and cache invalidation concurrently
    const [lessonPlan] = await Promise.all([
      // 1. Create the new lesson
      LessonPlan.create({
        createdBy: userId,
        classId: classId,
        lessonDate: req.body.date,
        parameters: req.body.parameters,
        plan: req.body.plan,
        status: req.body.status || "draft",
      }),
      // 2. CACHE FIX: Touch the user document to invalidate list caches
      User.findByIdAndUpdate(userId, { $set: { updatedAt: new Date() } }).exec()
    ]);

    res.status(201).json({
      success: true,
      message: "Lesson plan saved successfully!",
      data: lessonPlan,
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
    const lessonPlan = await LessonPlan.findById(req.params.id)
      .populate("classId", "className grade subject")
      .populate("approvedBy", "name email")
      .populate("createdBy", "name email"); // Populate creator details

    if (!lessonPlan) {
      return res.status(404).json({
        success: false,
        message: `Lesson plan not found with id of ${req.params.id}`,
      });
    }

    const canView =
      lessonPlan.createdBy._id.toString() === req.user.id ||
      lessonPlan.createdBy.toString() === req.user.id ||
      req.user.roles.some((role) =>
        ["admin", "super_admin", "math_head", "science_head", "english_head", "history_head", "geography_head"].includes(role)
      );

    if (!canView) {
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
    const userId = req.user.id;
    let lessonPlan = await LessonPlan.findById(req.params.id);

    if (!lessonPlan) {
      return res.status(404).json({
        success: false,
        message: `Lesson plan not found with id of ${req.params.id}`,
      });
    }

    if (lessonPlan.createdBy.toString() !== userId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to update this lesson plan",
      });
    }

    lessonPlan.plan = req.body.plan;
    await lessonPlan.save(); // Mongoose updates lessonPlan.updatedAt

    // CACHE FIX: Touch the user document to invalidate list caches
    await User.findByIdAndUpdate(userId, { $set: { updatedAt: new Date() } }).exec();

    res.status(200).json({ success: true, data: lessonPlan });
  } catch (error) {
    console.error("Error updating lesson plan:", error);
    next(error);
  }
};

/**
 * @desc    Delete a lesson plan by its ID (with cascade deletion)
 * @route   DELETE /api/lessons/:id
 * @access  Private
 */
exports.deleteLessonPlan = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const lessonPlan = await LessonPlan.findById(req.params.id);

    if (!lessonPlan) {
      return res.status(404).json({
        success: false,
        message: `Lesson plan not found with id of ${req.params.id}`,
      });
    }

    if (lessonPlan.createdBy.toString() !== userId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to delete this lesson plan",
      });
    }

    // Cascade deletion: Delete all related data
    const lessonPlanId = req.params.id;

    // Step 1: Find all assessments based on this lesson plan
    const assessments = await Assessment.find({ lessonPlanId: lessonPlanId });
    const assessmentIds = assessments.map((assessment) => assessment._id);

    console.log(
      `Found ${assessments.length} assessments to delete for lesson plan ${lessonPlanId}`
    );

    // Step 2: Delete all student answer submissions related to these assessments
    if (assessmentIds.length > 0) {
      const studentAnswersResult = await StudentAnswer.deleteMany({
        assessmentId: { $in: assessmentIds },
      });
      console.log(
        `Deleted ${studentAnswersResult.deletedCount} student answer submissions`
      );

      // Step 3: Delete all assessments related to this lesson plan
      const assessmentsResult = await Assessment.deleteMany({
        lessonPlanId: lessonPlanId,
      });
      console.log(`Deleted ${assessmentsResult.deletedCount} assessments`);
    }

    // Step 4: Delete the lesson plan itself
    await lessonPlan.deleteOne();

    // CACHE FIX: Touch the user document to invalidate list caches
    await User.findByIdAndUpdate(userId, { $set: { updatedAt: new Date() } }).exec();


    res.status(200).json({
      success: true,
      message: "Lesson plan and all related data deleted successfully",
      data: {
        deletedAssessments: assessmentIds.length,
        deletedSubmissions: assessmentIds.length > 0 ? "multiple" : 0,
      },
    });
  } catch (error) {
    console.error("Error in deleteLessonPlan:", error);
    next(error);
  }
};


/**
 * @desc    Get all lesson plans created by the currently logged-in user
 * @route   GET /api/lessons
 * @access  Private
 */
exports.getAllUserLessonPlans = async (req, res, next) => {
  try {
    // 1. Check cache status (sends 304 if not modified)
    const lastModifiedResult = await checkIfDataModified(req, res, req.user.id);

    if (lastModifiedResult === null) {
      return; // 304 response sent by helper
    }

    // 2. Fetch data if modified
    const lessonPlans = await LessonPlan.find({ createdBy: req.user.id })
      .populate({
        path: "classId",
        select: "className subject grade",
      })
      .sort({ lessonDate: -1 });

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
 * @desc    Get the 5 most recently updated lesson plans for the currently logged-in user
 * @route   GET /api/lessons/recent
 * @access  Private
 */
exports.getRecentLessonPlans = async (req, res, next) => {
  try {
    // 1. Check cache status (sends 304 if not modified)
    const lastModifiedResult = await checkIfDataModified(req, res, req.user.id);

    if (lastModifiedResult === null) {
      return; // 304 response sent by helper
    }

    // 2. Fetch data if modified
    const lessonPlans = await LessonPlan.find({ createdBy: req.user.id })
      .populate({
        path: "classId",
        select: "className subject grade",
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
    // NOTE: For class-specific lists, ideally we would track the class's updatedAt 
    // rather than the user's, but for simplicity, we skip caching here.
    const { classId } = req.params;

    const lessonPlans = await LessonPlan.find({
      createdBy: req.user.id,
      classId: classId,
    })
      .populate({
        path: "classId",
        select: "className subject grade",
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

    // 2. --- Get User and Gemini API Key ---
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
      if (handleGeminiApiError(res, geminiError)) return;
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

/**
 * @desc    Analyze a lesson plan and provide AI feedback
 * @route   POST /api/lessons/analyze
 * @access  Private
 */
exports.analyzeLessonPlan = async (req, res, next) => {
  try {
    const { plan, context } = req.body;

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Missing lesson plan data for analysis.",
      });
    }

    // Get User and Gemini API Key
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

    const prompt = `
      You are a senior pedagogical coach and curriculum expert. Your task is to review a lesson plan and provide constructive, actionable feedback to the teacher.

      Lesson Context:
      - Subject: ${context?.subject || "Not specified"}
      - Grade: ${context?.grade || "Not specified"}
      - Topic: ${context?.topic || "Not specified"}
      
      Lesson Plan Data:
      ${JSON.stringify(plan, null, 2)}

      Please analyze this lesson plan based on:
      1. Alignment with the learning objective.
      2. Student engagement and active learning.
      3. Clarity of instructions and flow.
      4. Assessment strategies (formative/summative).

      Provide your feedback in the following valid JSON format ONLY:
      {
        "strengths": ["Strength 1", "Strength 2"],
        "weaknesses": ["Weakness 1", "Weakness 2"],
        "suggestions": ["Actionable Suggestion 1", "Actionable Suggestion 2"]
      }
      
      Keep the points concise (under 20 words each). Do NOT result in markdown. Just the JSON object.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let analysisResult;
    try {
      const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      analysisResult = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse Gemini analysis response. Raw text:", text);
      throw new Error("The AI analysis response was not in a valid format.");
    }

    res.status(200).json({
      success: true,
      data: analysisResult,
    });

  } catch (error) {
    console.error("Analysis controller error:", error.message);
    // Handle Gemini specific errors if needed, or pass to global handler
    if (handleGeminiApiError(res, error)) return;

    res.status(500).json({
      success: false,
      message: error.message || "An error occurred during the analysis process.",
    });
  }
};


const { createNotification } = require("../utils/notificationHandler");

exports.sendForApproval = async (req, res) => {
  try {
    const lesson = await LessonPlan.findById(req.params.id)
      .populate("classId", "subject")
      .populate("createdBy", "schoolId name");

    if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found." });

    // Check if user is the creator
    if (lesson.createdBy?._id?.toString() !== req.user.id && lesson.createdBy?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    lesson.approvalStatus = "pending";
    await lesson.save();

    // --- NOTIFICATION LOGIC ---
    try {
      const subject = lesson.classId?.subject;
      let roleToNotify = "admin"; // Default fallback

      // Map Subject -> Role
      if (subject) {
        const normalizedSubject = subject.toLowerCase();
        if (normalizedSubject.includes("english")) roleToNotify = "english_head";
        else if (normalizedSubject.includes("math")) roleToNotify = "math_head";
        else if (normalizedSubject.includes("science")) roleToNotify = "science_head";
        else if (normalizedSubject.includes("history")) roleToNotify = "history_head";
        else if (normalizedSubject.includes("geography")) roleToNotify = "geography_head";
      }

      // Find users with this role (and optionally same school if SchoolId exists)
      const filter = { roles: roleToNotify };
      let recipients = await User.find(filter);

      // Fallback: If no subject head found, notify school_admin or principal
      if (recipients.length === 0) {
        recipients = await User.find({ roles: { $in: ["admin"] } });
      }

      // FIX: Always include Super Admins in the notification loop
      const superAdmins = await User.find({ roles: "super_admin" });

      // Combine and deduplicate recipients
      const allRecipients = [...recipients, ...superAdmins];
      const uniqueIds = new Set(allRecipients.map(u => u._id.toString()));

      // Create Notifications
      const notifications = [];
      for (const recipientId of uniqueIds) {
        notifications.push({
          recipient: recipientId,
          sender: req.user.id,
          type: "lesson_approval",
          lessonId: lesson._id,
          message: `${req.user.name} has submitted a ${subject || "lesson"} plan for approval.`,
          isRead: false
        });
      }

      if (notifications.length > 0) {
        // Use helper to save and emit
        await createNotification(req.app.get("io"), notifications);
      }

    } catch (notifyErr) {
      console.error("Failed to crate notifications:", notifyErr);
      // Don't fail the request if notification fails, just log it
    }


    res.status(200).json({ success: true, message: "Lesson sent for approval." });

    // CACHE FIX: Touch the user document to invalidate list caches
    await User.findByIdAndUpdate(req.user.id, { $set: { updatedAt: new Date() } }).exec();

  } catch (err) {
    console.error("Send for approval error:", err);
    res.status(500).json({ success: false, message: "Failed to send for approval." });
  }
};

exports.getPendingLessons = async (req, res) => {
  try {
    let filter = { approvalStatus: "pending" };

    const lessons = await LessonPlan.find(filter)
      .populate("classId", "className subject grade")
      .populate("createdBy", "name email");

    res.status(200).json({ success: true, data: lessons });
  } catch (err) {
    console.error("Error fetching pending lessons:", err);
    res.status(500).json({ success: false, message: "Failed to get pending lessons." });
  }
};

exports.approveLesson = async (req, res) => {
  try {
    const lesson = await LessonPlan.findById(req.params.id).populate("classId", "subject className");
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    lesson.approvalStatus = 'approved';
    lesson.approvedBy = req.user.id;
    lesson.approvalDate = new Date();
    await lesson.save();

    // Create Notification for the creator
    await createNotification(req.app.get("io"), {
      recipient: lesson.createdBy,
      sender: req.user.id,
      type: "lesson_approved",
      lessonId: lesson._id,
      message: `Your lesson plan "${lesson.classId?.subject || 'Lesson'}" has been approved by ${req.user.name}.`,
      isRead: false
    });

    res.json({ success: true, message: 'Lesson approved successfully!' });

    // CACHE FIX: Touch the CREATOR'S user document to invalidate their list caches
    // lesson.createdBy is an ID here (not populated)
    await User.findByIdAndUpdate(lesson.createdBy, { $set: { updatedAt: new Date() } }).exec();

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.rejectLesson = async (req, res) => {
  try {
    const lesson = await LessonPlan.findById(req.params.id).populate("classId", "subject className");
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    lesson.approvalStatus = 'rejected';
    lesson.approvedBy = req.user.id;
    lesson.approvalDate = new Date();
    lesson.remarks = req.body.remarks || req.body.reason || 'No reason specified.'; // Changed from rejectionReason to remarks
    await lesson.save();

    // Create Notification for the creator
    await createNotification(req.app.get("io"), {
      recipient: lesson.createdBy,
      sender: req.user.id,
      type: "lesson_rejected",
      lessonId: lesson._id,
      message: `Your lesson plan "${lesson.classId?.subject || 'Lesson'}" has been rejected. Remarks: ${lesson.remarks}`,
      isRead: false
    });

    res.json({ success: true, message: 'Lesson rejected successfully!' });

    // CACHE FIX: Touch the CREATOR'S user document to invalidate their list caches
    // lesson.createdBy is an ID here (not populated)
    await User.findByIdAndUpdate(lesson.createdBy, { $set: { updatedAt: new Date() } }).exec();

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllLessonsForApproval = async (req, res) => {
  try {
    const user = req.user;

    // Map subject head roles → subjects
    const roleToSubject = {
      math_head: "Mathematics",
      english_head: "English",
      science_head: "Science",
      history_head: "History",
      geography_head: "Geography",
    };

    // Base filter — exclude drafts
    let matchStage = {
      approvalStatus: { $nin: ["draft", null] }, // exclude drafts + nulls
    };

    const subjectRole = user.roles.find((r) => roleToSubject[r]);

    // Subject Head → Only their subject
    if (subjectRole) {
      matchStage = {
        ...matchStage,
        "classInfo.subject": roleToSubject[subjectRole],
      };
    }

    // Admin → Only their school
    else if (user.roles.includes("admin")) {
      console.log("Admin filtering applied for school:", user.schoolId);
      matchStage = {
        ...matchStage,
        "creatorInfo.schoolId": new mongoose.Types.ObjectId(user.schoolId), // Ensure ObjectId type
      };
    }

    // Super Admin → Can see everything (still no drafts)
    else if (user.roles.includes("super_admin")) {
      console.log("Super Admin - getting all pending lessons");
      // already covered by base match
    }

    console.log("Match Stage:", JSON.stringify(matchStage, null, 2));

    // Aggregation
    const lessons = await LessonPlan.aggregate([
      // Lookup Class Info for Subject filtering
      {
        $lookup: {
          from: "classes",
          localField: "classId",
          foreignField: "_id",
          as: "classInfo",
        },
      },
      { $unwind: { path: "$classInfo", preserveNullAndEmptyArrays: true } }, // Keep lessons even if class is deleted

      // Lookup User Info (Creator) for School filtering
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "creatorInfo",
        },
      },
      { $unwind: "$creatorInfo" },

      { $match: matchStage },
      { $sort: { createdAt: -1 } },

      // Project only necessary fields (optional but good for performace/security)
      // For now, keep it simple to ensure frontend gets what it needs
    ]);

    // Populate createdBy field explicitly if needed, but we already have creatorInfo. 
    // However, the frontend might expect `createdBy` to be an object.
    // The aggregation result has `creatorInfo` as an object. 
    // We can map it back or rely on Mongoose populate if we returned documents, but this is an aggregation.
    // Let's manually ensure the shape matches what frontend expects (usually populated createdBy).

    const formattedLessons = lessons.map(lesson => ({
      ...lesson,
      createdBy: lesson.creatorInfo, // Map creatorInfo back to createdBy
      classInfo: lesson.classInfo
    }));

    res.status(200).json({
      success: true,
      lessons: formattedLessons,
    });
  } catch (error) {
    console.error("❌ Error fetching lessons for approval:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch lessons.",
    });
  }
};