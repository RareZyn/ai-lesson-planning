// controller/assessmentController.js

const Assessment = require("../model/Assessment");
const LessonPlan = require("../model/Lesson");
const User = require("../model/User");
const AssessmentGenerator = require("../services/assessmentGenerator");
const { structureGeneratedContent } = require("../services/contentStructurer");
const { validateAndMapActivityType } = require("../utils/activityTypeMapper");

/**
 * Create Standalone Assessment
 */
const createStandaloneAssessment = async (req, res) => {
  try {
    console.log("📝 Creating standalone assessment:", req.body);

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found in request.",
      });
    }

    const {
      activityType: rawActivityType,
      grade,
      subject,
      classId,
      className,
      assessmentTitle,
      assessmentDescription,
      isStandalone,
      ...activityData
    } = req.body;

    console.log("🔍 Extracted data:", {
      rawActivityType,
      grade,
      subject,
      classId,
      assessmentTitle,
      isStandalone,
    });

    // Validate and map activity type
    const activityType = validateAndMapActivityType(rawActivityType);
    console.log(
      `🎯 Activity type validation: "${rawActivityType}" -> "${activityType}"`
    );

    // Validate required fields for standalone assessments
    if (!activityType || !grade || !subject) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: activityType, grade, subject",
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

    console.log("🔑 Gemini API key found, proceeding with generation...");

    // Create mock lesson plan data for standalone assessments
    const mockLessonPlanData = {
      lesson: activityData.specificTopic || `${subject} Assessment`,
      subject: subject,
      theme: activityData.theme || "",
      topic: activityData.specificTopic || activityData.topic || subject,
      grade: grade,
      contentStandard: {
        main: activityData.contentStandard?.main || "",
        component: activityData.contentStandard?.component || "",
      },
      learningStandard: {
        main: activityData.learningStandard?.main || "",
        component: activityData.learningStandard?.component || "",
      },
      learningOutline: {
        pre: activityData.learningOutline?.pre || "",
        during: activityData.learningOutline?.during || "",
        post: activityData.learningOutline?.post || "",
      },
      geminiApiKey,
      ...activityData,
    };

    console.log("📋 Mock lesson plan data:", mockLessonPlanData);

    // Generate content using the generator service
    const generator = new AssessmentGenerator(geminiApiKey);
    const generatedContent = await generator.generateByType(
      activityType,
      mockLessonPlanData
    );

    console.log("✨ Generated content from AI:", Object.keys(generatedContent));

    // Structure the content properly based on activity type
    const structuredContent = structureGeneratedContent(
      generatedContent,
      activityType,
      { paperType: activityData.paperType }
    );

    console.log("📦 Structured standalone content:", {
      activityHTML: !!structuredContent.activityHTML,
      rubricHTML: !!structuredContent.rubricHTML,
      assessmentHTML: !!structuredContent.assessmentHTML,
      answerKeyHTML: !!structuredContent.answerKeyHTML,
    });

    // Create the standalone assessment record
    const assessmentData = {
      title:
        assessmentTitle ||
        `${activityData.specificTopic || subject} - ${activityType} (${grade})`,
      description:
        assessmentDescription ||
        `Standalone ${activityType} assessment for ${subject}`,
      createdBy: req.user.id,

      // For standalone assessments, we don't have lesson plans
      lessonPlanId: null,

      // Class information (optional for standalone)
      classId: classId || null,

      // Activity and assessment metadata
      activityType: activityType,
      assessmentType: `Standalone ${activityType
        .charAt(0)
        .toUpperCase()}${activityType.slice(1)} Assessment`,
      questionCount: activityData.numberOfQuestions,
      duration:
        activityData.timeAllocation || activityData.duration || "60 minutes",
      difficulty: activityData.difficultyLevel || "Intermediate",
      skills: activityData.skills || [],

      // Add SPM exam configuration if applicable
      ...(activityType === "spm-exam" && {
        examConfiguration: {
          paperType: activityData.paperType,
          textSources: activityData.textSources,
          readingLevel: activityData.readingLevel,
          topics: activityData.topics,
          communicationFormat: activityData.communicationFormat,
          essayTypes: activityData.essayTypes,
          topicCategories: activityData.topicCategories,
          promptComplexity: activityData.promptComplexity,
          questionTypes: activityData.questionTypes,
        },
      }),

      // Generated content
      generatedContent: structuredContent,

      // Lesson plan snapshot for standalone assessments
      lessonPlanSnapshot: {
        title: activityData.specificTopic || `${subject} Assessment`,
        subject: subject,
        grade: grade,
        contentStandard: {
          main: activityData.contentStandard?.main || "",
          component: activityData.contentStandard?.component || "",
        },
        learningStandard: {
          main: activityData.learningStandard?.main || "",
          component: activityData.learningStandard?.component || "",
        },
        learningOutline: {
          pre: activityData.learningOutline?.pre || "",
          during: activityData.learningOutline?.during || "",
          post: activityData.learningOutline?.post || "",
        },
      },

      // Status and flags
      status: "Generated",
      hasActivity: structuredContent.hasStudentContent,
      hasRubric: structuredContent.hasTeacherContent,

      // Additional metadata for standalone assessments
      tags: activityData.tags || [],
      notes: activityData.additionalRequirement || "",

      // Mark as standalone
      isStandalone: true,
    };

    console.log("💾 Creating standalone assessment with data:", {
      title: assessmentData.title,
      activityType: assessmentData.activityType,
      hasActivity: assessmentData.hasActivity,
      hasRubric: assessmentData.hasRubric,
      isStandalone: assessmentData.isStandalone,
    });

    const assessment = await Assessment.create(assessmentData);

    console.log("✅ Standalone assessment created successfully:", {
      id: assessment._id,
      title: assessment.title,
      activityType: assessment.activityType,
    });

    // Return the complete response
    res.status(201).json({
      success: true,
      message: `Standalone ${activityType} assessment created successfully`,
      data: assessment,
      generatedContent: assessment.generatedContent,
    });
  } catch (error) {
    console.error("❌ Error in createStandaloneAssessment:", error);

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
      message: "Error creating standalone assessment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Generate Assessment from Lesson Plan
 */
const generateFromLessonPlan = async (req, res) => {
  try {
    // Check if this is a standalone assessment creation request
    if (req.body.isStandalone) {
      console.log("🔄 Routing to standalone assessment creation...");
      return await createStandaloneAssessment(req, res);
    }

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

    console.log("📚 Processing lesson-based assessment:", {
      rawActivityType,
      paperType: req.body.paperType,
      lesson,
      subject,
      grade,
    });

    // Validate and map activity type
    const activityType = validateAndMapActivityType(rawActivityType);
    console.log(
      `🎯 Activity type validation: "${rawActivityType}" -> "${activityType}"`
    );

    // Validate required fields for lesson-based assessments
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

    console.log(
      "🔑 Gemini API key found, starting generation for:",
      activityType
    );

    // Prepare generation data
    const generationData = {
      contentStandard,
      learningStandard,
      learningOutline,
      lesson,
      subject,
      theme,
      topic,
      grade,
      geminiApiKey,
      ...activityData,
      ...(activityType === "spm-exam" && {
        paperType: req.body.paperType || activityData.paperType || "paper1",
        form: req.body.form || activityData.form || grade,
        timeAllocation:
          req.body.timeAllocation || activityData.timeAllocation || "90",
        difficultyLevel:
          req.body.difficultyLevel ||
          activityData.difficultyLevel ||
          "Intermediate",
        textSources:
          req.body.textSources ||
          activityData.textSources || ["newspapers", "magazines"],
        readingLevel: req.body.readingLevel || activityData.readingLevel || grade,
        topics: req.body.topics || activityData.topics || ["general"],
        communicationFormat:
          req.body.communicationFormat ||
          activityData.communicationFormat ||
          "email",
        essayTypes:
          req.body.essayTypes ||
          activityData.essayTypes || ["descriptive", "narrative"],
        topicCategories:
          req.body.topicCategories ||
          activityData.topicCategories || ["general"],
        promptComplexity:
          req.body.promptComplexity ||
          activityData.promptComplexity ||
          "moderate",
        questionTypes:
          req.body.questionTypes || activityData.questionTypes || {},
      }),
    };

    // Generate content using the generator service
    const generator = new AssessmentGenerator(geminiApiKey);
    const generatedContent = await generator.generateByType(
      activityType,
      generationData
    );

    console.log("✨ Generated content from AI:", Object.keys(generatedContent));

    if (!generatedContent || Object.keys(generatedContent).length === 0) {
      throw new Error("No content was generated from AI");
    }

    // Ensure we have the user properly
    if (!req.user) {
      req.user = { id: "test-user-id" };
    }

<<<<<<< HEAD
    // Structure the content properly based on activity type
    const structuredContent = structureGeneratedContent(
      generatedContent,
      activityType,
      { paperType: req.body.paperType || activityData.paperType }
    );

    console.log("📦 Creating lesson-based assessment with data:", {
=======
    // FIXED: Structure the content properly based on activity type
    const structuredContent = structureGeneratedContent(
      generatedContent,
      activityType
    );

    console.log("Creating assessment with data:", {
>>>>>>> nijam-part
      title: assessmentTitle || `${lesson} - ${activityType}`,
      activityType,
      lessonPlanId,
      classId,
      createdBy: req.user.id,
<<<<<<< HEAD
      hasStudentContent: structuredContent.hasStudentContent,
      hasTeacherContent: structuredContent.hasTeacherContent,
    });

    // Save assessment to database with proper content structure
=======
      structuredContent,
    });

    // FIXED: Save assessment to database with proper content structure
>>>>>>> nijam-part
    const assessmentData = {
      title: assessmentTitle || `${lesson} - ${activityType}`,
      description:
        assessmentDescription || `Generated ${activityType} assessment`,
      createdBy: req.user.id,
      lessonPlanId,
      classId,
<<<<<<< HEAD
      activityType: activityType,
      assessmentType: `${activityType
        .charAt(0)
        .toUpperCase()}${activityType.slice(1)} Assessment`,
      questionCount: activityData.numberOfQuestions,
      duration:
        req.body.timeAllocation ||
        activityData.timeAllocation ||
        activityData.duration ||
        "60 minutes",
      difficulty: req.body.difficultyLevel || "Intermediate",
      skills: [],
=======
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
>>>>>>> nijam-part
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
<<<<<<< HEAD
      hasActivity: structuredContent.hasStudentContent,
      hasRubric: structuredContent.hasTeacherContent,

      // Add SPM exam configuration if applicable
      ...(activityType === "spm-exam" && {
        examConfiguration: {
          paperType: req.body.paperType || "paper1",
          textSources: req.body.textSources || [],
          readingLevel: req.body.readingLevel || grade,
          topics: req.body.topics || [],
          communicationFormat: req.body.communicationFormat || "email",
          essayTypes: req.body.essayTypes || [],
          topicCategories: req.body.topicCategories || [],
          promptComplexity: req.body.promptComplexity || "moderate",
          questionTypes: req.body.questionTypes || {},
        },
      }),
    };

    console.log("💾 Assessment data to save:", {
      title: assessmentData.title,
      activityType: assessmentData.activityType,
      hasActivity: assessmentData.hasActivity,
      hasRubric: assessmentData.hasRubric,
      examConfiguration: assessmentData.examConfiguration
        ? "Present"
        : "Not present",
    });

    const assessment = await Assessment.create(assessmentData);

=======
      // FIXED: Set proper flags based on content availability and activity type
      hasActivity: structuredContent.hasStudentContent,
      hasRubric: structuredContent.hasTeacherContent,
    };

    console.log("Assessment data to save:", assessmentData);

    const assessment = await Assessment.create(assessmentData);

    console.log("Assessment created successfully:", assessment._id);
    console.log("Saved generatedContent:", assessment.generatedContent);

>>>>>>> nijam-part
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
<<<<<<< HEAD
      console.log(`✅ Updated lesson plan ${lessonPlanId} status to generated`);
    } catch (lessonPlanError) {
      console.error("❌ Error updating lesson plan status:", lessonPlanError);
    }

    console.log("🎉 Assessment generated successfully:", {
      id: assessment._id,
      title: assessment.title,
      activityType: assessment.activityType,
      hasActivity: assessment.hasActivity,
      hasRubric: assessment.hasRubric,
    });

    // Return the complete response with all content
=======
      console.log(`Updated lesson plan ${lessonPlanId} status to generated`);
    } catch (lessonPlanError) {
      console.error("Error updating lesson plan status:", lessonPlanError);
    }

    // FIXED: Return the complete response with all content
>>>>>>> nijam-part
    res.status(201).json({
      success: true,
      message: `${activityType} assessment generated and saved successfully`,
      data: assessment,
<<<<<<< HEAD
      generatedContent: assessment.generatedContent,
    });
  } catch (error) {
    console.error("❌ Error in generateFromLessonPlan:", error);

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

=======
      generatedContent: assessment.generatedContent, // Include the generated content in response
    });
  } catch (error) {
    console.error("Error in generateFromLessonPlan:", error);
>>>>>>> nijam-part
    res.status(500).json({
      success: false,
      message: "Error generating assessment from lesson plan",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

<<<<<<< HEAD
/**
 * Get Standalone Assessments
 */
const getStandaloneAssessments = async (req, res) => {
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

    console.log("🔍 Getting standalone assessments with filters:", {
      page,
      limit,
      classId,
      rawActivityType,
      status,
      search,
    });

    // Build filter object for standalone assessments only
    const filter = {
      createdBy: req.user.id,
      $or: [
        { lessonPlanId: { $exists: false } },
        { lessonPlanId: null },
        { isStandalone: true },
      ],
    };

    if (classId) filter.classId = classId;

    // Validate activity type filter
    if (rawActivityType) {
      const mappedActivityType = validateAndMapActivityType(rawActivityType);
      filter.activityType = mappedActivityType;
    }

    if (status) filter.status = status;

    if (search) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { assessmentType: { $regex: search, $options: "i" } },
        ],
      });
    }

    console.log("📋 Standalone assessments filter query:", filter);

    // Execute query with pagination
    const assessments = await Assessment.find(filter)
      .populate({
        path: "classId",
        select: "className grade subject year",
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Assessment.countDocuments(filter);

    console.log(
      `✅ Found ${assessments.length} standalone assessments out of ${total} total`
    );

    // Transform assessments to include grade and subject info for standalone assessments
    const transformedAssessments = assessments.map((assessment) => {
      const transformed = assessment.toObject();

      // For standalone assessments, extract grade and subject from lessonPlanSnapshot or classId
      if (!transformed.classId) {
        transformed.grade = transformed.lessonPlanSnapshot?.grade || "General";
        transformed.subject =
          transformed.lessonPlanSnapshot?.subject || "General";
        transformed.className = "General";
      } else {
        transformed.grade =
          transformed.classId?.grade ||
          transformed.lessonPlanSnapshot?.grade ||
          "General";
        transformed.subject =
          transformed.classId?.subject ||
          transformed.lessonPlanSnapshot?.subject ||
          "General";
        transformed.className = transformed.classId?.className || "General";
      }

      return transformed;
    });

    res.status(200).json({
      success: true,
      count: transformedAssessments.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: transformedAssessments,
    });
  } catch (error) {
    console.error("❌ Get standalone assessments error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching standalone assessments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Update Standalone Assessment
 */
const updateStandaloneAssessment = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found in request.",
      });
    }

    const assessmentId = req.params.id;
    const updateData = req.body;

    console.log("🔄 Updating standalone assessment:", {
      assessmentId,
      updateData: Object.keys(updateData),
    });

    // Find the assessment
    const assessment = await Assessment.findById(assessmentId);

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

    // Validate activity type if provided
    if (updateData.activityType) {
      updateData.activityType = validateAndMapActivityType(
        updateData.activityType
      );
    }

    // Update the assessment
    const updatedAssessment = await Assessment.findByIdAndUpdate(
      assessmentId,
      {
        ...updateData,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).populate({
      path: "classId",
      select: "className grade subject year",
    });

    console.log("✅ Standalone assessment updated successfully");

    res.status(200).json({
      success: true,
      message: "Standalone assessment updated successfully",
      data: updatedAssessment,
    });
  } catch (error) {
    console.error("❌ Update standalone assessment error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating standalone assessment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Delete Standalone Assessment
 */
const deleteStandaloneAssessment = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found in request.",
      });
    }

    const assessmentId = req.params.id;

    console.log("🗑️ Deleting standalone assessment:", assessmentId);

    const assessment = await Assessment.findById(assessmentId);

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

    await assessment.deleteOne();

    console.log("✅ Standalone assessment deleted successfully");

    res.status(200).json({
      success: true,
      message: "Standalone assessment deleted successfully",
      data: {},
    });
  } catch (error) {
    console.error("❌ Delete standalone assessment error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting standalone assessment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get Lesson Plans Without Assessments
 */
const getLessonPlansWithoutAssessments = async (req, res) => {
  try {
=======
// Add method to get lesson plans without assessments
const getLessonPlansWithoutAssessments = async (req, res) => {
  try {
    const LessonPlan = require("../model/Lesson");

>>>>>>> nijam-part
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

<<<<<<< HEAD
/**
 * Get User Assessments Filtered
 */
=======
// Get filtered assessments method
>>>>>>> nijam-part
const getUserAssessmentsFiltered = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      classId,
<<<<<<< HEAD
      lessonPlanId,
=======
>>>>>>> nijam-part
      activityType: rawActivityType,
      status,
      search,
      hasLessonPlan,
    } = req.query;

<<<<<<< HEAD
    console.log("🔍 Getting filtered assessments:", {
      page,
      limit,
      classId,
      lessonPlanId,
      rawActivityType,
      status,
      search,
      hasLessonPlan,
    });

    // Build filter object
    const filter = { createdBy: req.user.id };

    // Filter by specific lesson plan ID (highest priority)
    if (lessonPlanId) {
      filter.lessonPlanId = lessonPlanId;
      // Explicitly exclude standalone assessments when filtering by lesson plan
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { isStandalone: { $exists: false } },
          { isStandalone: false },
          { isStandalone: null }
        ]
      });
    } else if (hasLessonPlan !== undefined) {
      // Filter by lesson plan presence (only if lessonPlanId not specified)
      if (hasLessonPlan === "true") {
        filter.lessonPlanId = { $exists: true, $ne: null };
      } else if (hasLessonPlan === "false") {
        filter.$or = [
          { lessonPlanId: { $exists: false } },
          { lessonPlanId: null },
          { isStandalone: true },
        ];
      }
    }

=======
    // Build filter object
    const filter = { createdBy: req.user.id };

>>>>>>> nijam-part
    if (classId) filter.classId = classId;

    // Validate activity type filter
    if (rawActivityType) {
      const mappedActivityType = validateAndMapActivityType(rawActivityType);
      filter.activityType = mappedActivityType;
    }

    if (status) filter.status = status;

<<<<<<< HEAD
    if (search) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { assessmentType: { $regex: search, $options: "i" } },
        ],
      });
    }

    console.log("📋 Assessment filter query:", filter);
=======
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
>>>>>>> nijam-part

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

<<<<<<< HEAD
    // Transform assessments to include necessary info for display
    const transformedAssessments = assessments.map((assessment) => {
      const transformed = assessment.toObject();

      // For standalone assessments, extract info from lessonPlanSnapshot
      if (!transformed.lessonPlanId) {
        transformed.grade =
          transformed.lessonPlanSnapshot?.grade ||
          transformed.classId?.grade ||
          "General";
        transformed.subject =
          transformed.lessonPlanSnapshot?.subject ||
          transformed.classId?.subject ||
          "General";
        transformed.className = transformed.classId?.className || "General";
      }

      return transformed;
    });

    console.log(
      `✅ Found ${transformedAssessments.length} assessments out of ${total} total`
    );

    res.status(200).json({
      success: true,
      count: transformedAssessments.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: transformedAssessments,
    });
  } catch (error) {
    console.error("❌ Get filtered assessments error:", error);
=======
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
>>>>>>> nijam-part
    res.status(500).json({
      success: false,
      message: "Error fetching assessments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

<<<<<<< HEAD
/**
 * Save Assessment
 */
=======
// Helper functions for different assessment types
// Fixed generateActivityContent function with better error handling and flexible regex
const generateActivityContent = async (data) => {
  try {
    console.log("Generating activity content with data:", data);

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You generate HTML student activities and teacher rubrics for classroom assessments. You must return exactly two HTML blocks with the specified comment headers.",
        },
        {
          role: "user",
          content: buildActivityPrompt(data),
        },
      ],
    });

    const output = response.choices[0].message.content;
    console.log("Raw AI output length:", output.length);
    console.log("Raw AI output preview:", output.substring(0, 500) + "...");

    // More flexible regex patterns to handle variations in comments and spacing
    const patterns = [
      // Original pattern
      /```html\s*<!-- STUDENT ASSESSMENT -->\s*([\s\S]*?)\s*```[\s\S]*?```html\s*<!-- TEACHER ANSWER KEY -->\s*([\s\S]*?)\s*```/,

      // Alternative patterns for different comment formats
      /```html\s*<!-- STUDENT ACTIVITY -->\s*([\s\S]*?)\s*```[\s\S]*?```html\s*<!-- TEACHER RUBRIC -->\s*([\s\S]*?)\s*```/,

      // Pattern without specific comments
      /```html\s*([\s\S]*?)\s*```[\s\S]*?```html\s*([\s\S]*?)\s*```/,

      // Pattern with more flexible spacing
      /```html[^`]*?<!-- STUDENT[^>]*? -->[^`]*?([\s\S]*?)\s*```[\s\S]*?```html[^`]*?<!-- TEACHER[^>]*? -->[^`]*?([\s\S]*?)\s*```/i,
    ];

    let match = null;
    let patternUsed = -1;

    // Try each pattern until one matches
    for (let i = 0; i < patterns.length; i++) {
      match = output.match(patterns[i]);
      if (match && match.length >= 3) {
        patternUsed = i;
        console.log(`Successfully matched with pattern ${i}`);
        break;
      }
    }

    // If no pattern matched, try to extract any two HTML blocks
    if (!match) {
      console.warn(
        "No specific pattern matched, trying to extract any two HTML blocks"
      );
      const htmlBlocks = output.match(/```html\s*([\s\S]*?)\s*```/g);

      if (htmlBlocks && htmlBlocks.length >= 2) {
        const firstBlock = htmlBlocks[0].match(/```html\s*([\s\S]*?)\s*```/)[1];
        const secondBlock = htmlBlocks[1].match(
          /```html\s*([\s\S]*?)\s*```/
        )[1];

        match = [null, firstBlock.trim(), secondBlock.trim()];
        console.log("Extracted two HTML blocks as fallback");
      }
    }

    if (!match || match.length < 3) {
      console.error("Failed to parse AI response. Full output:", output);

      // Log what we found for debugging
      const htmlBlocks = output.match(/```html/g);
      console.error(
        "Number of HTML blocks found:",
        htmlBlocks ? htmlBlocks.length : 0
      );

      // Try to provide more helpful error information
      if (output.includes("```html")) {
        console.error(
          "HTML blocks detected but regex failed. Checking format..."
        );
        const allHtmlContent = output.match(/```html[\s\S]*?```/g);
        if (allHtmlContent) {
          console.error("All HTML blocks found:", allHtmlContent.length);
          allHtmlContent.forEach((block, index) => {
            console.error(
              `Block ${index + 1} preview:`,
              block.substring(0, 100) + "..."
            );
          });
        }
      }

      throw new Error(
        `Invalid response format from AI - could not extract HTML blocks. Pattern used: ${patternUsed}`
      );
    }

    const result = {
      activityHTML: match[1].trim(),
      rubricHTML: match[2].trim(),
    };

    // Validate that we have actual content
    if (!result.activityHTML || result.activityHTML.length < 50) {
      console.warn(
        "Activity HTML seems too short:",
        result.activityHTML?.length
      );
    }

    if (!result.rubricHTML || result.rubricHTML.length < 50) {
      console.warn("Rubric HTML seems too short:", result.rubricHTML?.length);
    }

    console.log("Successfully generated activity content:", {
      activityHTML: result.activityHTML
        ? `${result.activityHTML.length} chars`
        : "Missing",
      rubricHTML: result.rubricHTML
        ? `${result.rubricHTML.length} chars`
        : "Missing",
      patternUsed: patternUsed,
    });

    return result;
  } catch (error) {
    console.error("Error in generateActivityContent:", error);

    // If it's our custom error, re-throw it
    if (error.message.includes("Invalid response format from AI")) {
      throw error;
    }

    // For other errors (API, network, etc.), wrap them
    throw new Error(`Failed to generate activity content: ${error.message}`);
  }
};

const generateEssayContent = async (data) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You generate HTML student activities and teacher rubrics for KSSM English essay assessments.",
      },
      {
        role: "user",
        content: buildEssayPrompt(data),
      },
    ],
  });

  const output = response.choices[0].message.content;
  const match = output.match(
    /```html\s*<!-- STUDENT ACTIVITY -->\s*(.*?)\s*```[\s\n]*```html\s*<!-- TEACHER RUBRIC -->\s*(.*?)\s*```/s
  );

  if (!match || match.length < 3) {
    throw new Error("Invalid response format from AI");
  }

  return {
    activityHTML: match[1].trim(),
    rubricHTML: match[2].trim(),
  };
};

const generateTextbookContent = async (data) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You generate HTML classroom textbook-based activities and teacher rubrics for the Malaysian curriculum.",
      },
      {
        role: "user",
        content: buildTextbookPrompt(data),
      },
    ],
  });

  const output = response.choices[0].message.content;
  const match = output.match(
    /```html\s*<!-- STUDENT ACTIVITY -->\s*(.*?)\s*```[\s\n]*```html\s*<!-- TEACHER RUBRIC -->\s*(.*?)\s*```/s
  );

  if (!match || match.length < 3) {
    throw new Error("Invalid response format from AI");
  }

  return {
    activityHTML: match[1].trim(),
    rubricHTML: match[2].trim(),
  };
};

// FIXED: Assessment content generation - return proper field names
const generateAssessmentContent = async (data) => {
  console.log("Generating assessment content with data:", data);

  const numberOfQuestions = data.numberOfQuestions || 20;
  console.log(`Generating assessment with ${numberOfQuestions} questions`);

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    temperature: 0.7, // Slight creativity for question variety
    messages: [
      {
        role: "system",
        content: `You are an expert assessment creator for English language evaluation. You MUST generate exactly ${numberOfQuestions} questions as requested. Do not stop until all ${numberOfQuestions} questions are complete. Each question should be numbered clearly and include proper formatting.`,
      },
      {
        role: "user",
        content: buildAssessmentPrompt(data),
      },
    ],
  });

  const output = response.choices[0].message.content;
  console.log("Raw AI output length:", output.length);
  console.log("Raw AI output preview:", output.substring(0, 500) + "...");

  const match = output.match(
    /```html\s*<!-- STUDENT ASSESSMENT -->\s*([\s\S]*?)\s*```[\s\S]*?```html\s*<!-- TEACHER ANSWER KEY -->\s*([\s\S]*?)\s*```/
  );

  if (!match || match.length < 3) {
    console.error("Failed to parse AI response. Full output:", output);
    throw new Error(
      "Invalid response format from AI - could not extract HTML blocks"
    );
  }

  const result = {
    assessmentHTML: match[1].trim(),
    answerKeyHTML: match[2].trim(),
  };

  // Verify question count in generated content
  const questionMatches = [
    result.assessmentHTML.match(/<(?:div|p|li)[^>]*>\s*\d+\.\s*/gi),
    result.assessmentHTML.match(/\b\d+\.\s+[A-Z]/g),
    result.assessmentHTML.match(/<h[3-6][^>]*>Question\s+\d+/gi),
    result.assessmentHTML.match(/Question\s+\d+:/gi),
  ].filter(Boolean);

  const detectedQuestions =
    questionMatches.length > 0
      ? Math.max(...questionMatches.map((m) => m.length))
      : 0;

  console.log(`Generated content analysis:`, {
    assessmentHTML: result.assessmentHTML ? "Generated" : "Missing",
    answerKeyHTML: result.answerKeyHTML ? "Generated" : "Missing",
    assessmentLength: result.assessmentHTML.length,
    answerKeyLength: result.answerKeyHTML.length,
    detectedQuestions: detectedQuestions,
    requestedQuestions: numberOfQuestions,
  });

  if (detectedQuestions < numberOfQuestions) {
    console.warn(
      `⚠️  Generated ${detectedQuestions} questions but ${numberOfQuestions} were requested. Regenerating...`
    );

    // Try one more time with a more explicit prompt
    return await retryAssessmentGeneration(data, numberOfQuestions);
  }

  return result;
};

// ADDED: Retry function for when question count is insufficient
const retryAssessmentGeneration = async (data, numberOfQuestions) => {
  console.log(
    `Retrying assessment generation with emphasis on ${numberOfQuestions} questions`
  );

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    temperature: 0.5,
    messages: [
      {
        role: "system",
        content: `You are creating an assessment with EXACTLY ${numberOfQuestions} questions. This is critical - you must not stop until you have generated all ${numberOfQuestions} questions. Count as you go: Question 1, Question 2, etc., up to Question ${numberOfQuestions}.`,
      },
      {
        role: "user",
        content: buildEnhancedAssessmentPrompt(data, numberOfQuestions),
      },
    ],
  });

  const output = response.choices[0].message.content;
  console.log("Retry attempt - AI output length:", output.length);

  const match = output.match(
    /```html\s*<!-- STUDENT ASSESSMENT -->\s*([\s\S]*?)\s*```[\s\S]*?```html\s*<!-- TEACHER ANSWER KEY -->\s*([\s\S]*?)\s*```/
  );

  if (!match || match.length < 3) {
    console.error("Retry failed to parse AI response. Full output:", output);
    throw new Error("Retry failed - Invalid response format from AI");
  }

  return {
    assessmentHTML: match[1].trim(),
    answerKeyHTML: match[2].trim(),
  };
};

// Helper functions to build prompts (keeping the existing ones)
const buildActivityPrompt = (data) => {
  return `
# Identity

You are an AI assistant helping to generate creative and pedagogically sound in-class assessments and rubrics for English language teachers based on Malaysian KSSM curriculum lesson plans.

# CRITICAL OUTPUT FORMAT REQUIREMENT

You MUST return your response in this EXACT format with no additional text:

\`\`\`html
<!-- STUDENT ASSESSMENT -->
<!DOCTYPE html>
<html>
<head>
    <title>Student Activity</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .activity { margin: 15px 0; padding: 10px; border-left: 3px solid #007acc; }
    </style>
</head>
<body>
    <!-- Your student activity content here -->
</body>
</html>
\`\`\`

\`\`\`html
<!-- TEACHER ANSWER KEY -->
<!DOCTYPE html>
<html>
<head>
    <title>Teacher Rubric</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .rubric { margin: 15px 0; padding: 10px; background: #f0f8ff; border-radius: 5px; }
    </style>
</head>
<body>
    <!-- Your teacher rubric content here -->
</body>
</html>
\`\`\`

Do not include ANY other text, explanations, or content outside of these two HTML blocks.

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

# Requirements

1. Generate complete, valid HTML documents for both student and teacher sections
2. Include proper styling for print-friendly layouts
3. Make the student activity engaging and age-appropriate
4. Create a comprehensive rubric for teachers
5. Base content on the provided lesson data

Remember: Return ONLY the two HTML blocks with the exact comment headers shown above.
`;
};

const buildEssayPrompt = (data) => {
  return `
# Identity

You are an AI assistant that creates HTML-based student essay tasks and teacher grading rubrics based on Malaysian KSSM curriculum lesson plans. All outputs must follow a professional, styled, printable A4-friendly layout.

# Instructions

You must return exactly two blocks of HTML content:

1. 🎓 Student Essay Activity Sheet (Styled HTML)
2. 🧑‍🏫 Teacher Rubric Sheet (Styled HTML)

Both must:
- Be ready to print on A4 size
- Be visually clear, with headings, sections, and consistent fonts
- Use modern styling (e.g., clean layout, color headers, table borders for rubrics)

## Student Essay Activity Guidelines
- Include fields for Student Name, Class, and Teacher Name
- Provide a clear title and engaging prompt related to the lesson topic
- Include bullet points under instructions explaining what to write
- Add a large text box for the essay (at least 600px height)
- Include a note to students about tone, grammar, and proofreading
- Word count requirement: ${data.wordCount || "200-300 words"}
- Duration: ${data.duration || "60 minutes"}

## Teacher Rubric Guidelines
- Create a 5-column rubric table with: Criteria | Excellent (5) | Good (4) | Satisfactory (3) | Needs Improvement (1–2)
- Include categories like Content, Organization, Tone, Language Use, and Creativity
- Add a total score summary and grading scale (e.g., 23–25 = Excellent)
- Use styled borders, background colors for headers, and even-row shading

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
  "activityType": "essay",
  "essayType": "${data.essayType || "descriptive"}",
  "wordCount": "${data.wordCount || "200-300 words"}",
  "duration": "${data.duration || "60 minutes"}",
  "additionalRequirement": "${data.additionalRequirement || ""}"
}

# Output Format

1. Begin your response with \`\`\`html\n<!-- STUDENT ACTIVITY -->\n<html>...</html>\n\`\`\`
2. Then add a second HTML block: \`\`\`html\n<!-- TEACHER RUBRIC -->\n<html>...</html>\n\`\`\`

Do not include anything else. Just the raw HTMLs.
`;
};

const buildTextbookPrompt = (data) => {
  return `
# Identity

You are an AI assistant that generates printable HTML-based classroom activities and teacher rubrics based on the Malaysian KSSM curriculum. This request is for a **Textbook-Based Activity**.

# Instructions

You must return exactly two blocks of HTML content:

1. 📘 Student Activity Sheet – Textbook Based (Styled HTML)
2. 🧑‍🏫 Teacher Rubric Sheet (Styled HTML)

### Student Activity Sheet Must Include:
- Title and lesson info (Lesson name, subject, theme, topic)
- Fields for Student Name, Class, and Teacher Name
- Reference to the specific textbook page(s)
- Clear pre-, during-, and post-activity tasks based on provided outline
- An open-ended task or reflective question aligned to textbook goals
- A creative note or prompt (e.g., reflection, group discussion, or journal)

### Teacher Rubric Must Include:
- A 5-column scoring table: Criteria | Excellent (5) | Good (4) | Satisfactory (3) | Needs Improvement (1–2)
- Criteria: Understanding, Participation, Communication, Collaboration, Creativity
- Total score summary and simple grading scale

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
  "activityType": "textbook",
  "additionalRequirement": "${data.additionalRequirement || ""}"
}

# Output Format

1. Begin your response with \`\`\`html\n<!-- STUDENT ACTIVITY -->\n<html>...</html>\n\`\`\`
2. Then add a second HTML block: \`\`\`html\n<!-- TEACHER RUBRIC -->\n<html>...</html>\n\`\`\`

No extra explanation. Just two valid HTML blocks.
`;
};

// FIXED: Assessment prompt to generate proper content
const buildAssessmentPrompt = (data) => {
  const numberOfQuestions = data.numberOfQuestions || 20;
  const questionTypes = Array.isArray(data.questionTypes)
    ? data.questionTypes.join(", ")
    : data.questionTypes || "multiple_choice, short_answer";

  return `
# CRITICAL REQUIREMENT: Generate EXACTLY ${numberOfQuestions} questions

You must create a complete English assessment with exactly ${numberOfQuestions} questions based on the lesson "${
    data.lesson || "English Lesson"
  }".

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

Generate TWO HTML blocks:

**Block 1: STUDENT ASSESSMENT PAPER**
\`\`\`html
<!-- STUDENT ASSESSMENT -->
<!DOCTYPE html>
<html>
<head>
    <title>${data.lesson || "English Assessment"}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .question { margin: 20px 0; padding: 10px; border-left: 3px solid #007acc; }
        .answer-space { border-bottom: 1px solid #ccc; margin: 10px 0; height: 20px; }
        .instructions { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${data.lesson || "English Assessment"}</h1>
        <p>Subject: ${data.subject || "English"} | Time: ${
    data.timeAllocation || "60 minutes"
  } | Total Questions: ${numberOfQuestions}</p>
        <p>Name: _________________ Class: _____________ Date: _____________</p>
    </div>
    
    <div class="instructions">
        <h3>Instructions:</h3>
        <ul>
            <li>Read all questions carefully before answering</li>
            <li>Answer ALL ${numberOfQuestions} questions</li>
            <li>Write clearly and legibly</li>
            <li>Manage your time wisely</li>
        </ul>
    </div>

    <!-- Generate all ${numberOfQuestions} questions here -->
    <div class="question">
        <h4>Question 1:</h4>
        <!-- Question content -->
    </div>
    
    <!-- Continue for ALL ${numberOfQuestions} questions -->
    
</body>
</html>
\`\`\`

**Block 2: TEACHER ANSWER KEY**
\`\`\`html  
<!-- TEACHER ANSWER KEY -->
<!DOCTYPE html>
<html>
<head>
    <title>Answer Key - ${data.lesson || "English Assessment"}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .answer { margin: 15px 0; padding: 10px; background: #f0f8ff; border-radius: 5px; }
        .points { color: #007acc; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ANSWER KEY</h1>
        <h2>${data.lesson || "English Assessment"}</h2>
        <p>Total Questions: ${numberOfQuestions} | Answer Key & Marking Guide</p>
    </div>

    <!-- Provide answers for all ${numberOfQuestions} questions -->
    <div class="answer">
        <h4>Question 1: <span class="points">[X points]</span></h4>
        <p><strong>Answer:</strong> [Correct answer]</p>
        <p><strong>Marking notes:</strong> [Guidance for teachers]</p>
    </div>
    
    <!-- Continue for ALL ${numberOfQuestions} questions -->
    
</body>
</html>
\`\`\`

Remember: You MUST generate exactly ${numberOfQuestions} questions. Count them as you write to ensure you reach the required number.
`;
};

// ADDED: Enhanced prompt for retry attempts
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
Generate TWO complete HTML documents:

1. **STUDENT ASSESSMENT** with ALL ${numberOfQuestions} questions numbered clearly
2. **TEACHER ANSWER KEY** with answers to ALL ${numberOfQuestions} questions

Start with:
\`\`\`html
<!-- STUDENT ASSESSMENT -->
[Complete HTML with ${numberOfQuestions} questions]
\`\`\`

\`\`\`html  
<!-- TEACHER ANSWER KEY -->
[Complete answer key for ${numberOfQuestions} questions]
\`\`\`

DO NOT STOP until you have written Question ${numberOfQuestions}!
`;
};

>>>>>>> nijam-part
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
<<<<<<< HEAD
=======

>>>>>>> nijam-part
    // Create assessment
    const assessment = await Assessment.create({
      title,
      description,
      createdBy: req.user.id,
      lessonPlanId,
      classId,
<<<<<<< HEAD
      activityType: activityType,
      assessmentType: assessmentType || "General Assessment",
      questionCount: questionCount,
=======
      activityType, // Use validated activity type
      assessmentType: assessmentType || "General Assessment",
      questionCount: questionCount || 20,
>>>>>>> nijam-part
      duration: duration || "60 minutes",
      difficulty: difficulty || "Intermediate",
      skills: skills || [],
      generatedContent: generatedContent || {},
      lessonPlanSnapshot: lessonPlanSnapshot || {},
      tags: tags || [],
      notes: notes || "",
      status: generatedContent ? "Generated" : "Draft",
<<<<<<< HEAD
      hasActivity: !!(
        generatedContent &&
        (generatedContent.activityContent || generatedContent.assessmentContent)
      ),
      hasRubric: !!(
        generatedContent &&
        (generatedContent.rubricContent || generatedContent.answerKeyContent)
      ),
=======
      hasActivity: !!(generatedContent && generatedContent.activityHTML),
      hasRubric: !!(generatedContent && generatedContent.rubricHTML),
>>>>>>> nijam-part
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
<<<<<<< HEAD
 * Get User Assessments
=======
 * @desc    Get user's assessments with filtering
 * @route   GET /api/assessment/my-assessments
 * @access  Private
>>>>>>> nijam-part
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
<<<<<<< HEAD
=======

>>>>>>> nijam-part
    const {
      page = 1,
      limit = 10,
      classId,
<<<<<<< HEAD
      lessonPlanId,
=======
>>>>>>> nijam-part
      activityType: rawActivityType,
      status,
      search,
    } = req.query;
<<<<<<< HEAD
    // Build filter object
    const filter = { createdBy: req.user.id };
    if (classId) filter.classId = classId;
    if (lessonPlanId) {
      // When filtering by lesson plan, only get assessments created from that lesson plan
      // Explicitly exclude standalone assessments
      filter.lessonPlanId = lessonPlanId;
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { isStandalone: { $exists: false } },
          { isStandalone: false },
          { isStandalone: null }
        ]
      });
    }
=======

    // Build filter object
    const filter = { createdBy: req.user.id };

    if (classId) filter.classId = classId;

>>>>>>> nijam-part
    // Validate activity type filter
    if (rawActivityType) {
      const mappedActivityType = validateAndMapActivityType(rawActivityType);
      filter.activityType = mappedActivityType;
    }
<<<<<<< HEAD
    if (status) filter.status = status;
=======

    if (status) filter.status = status;

>>>>>>> nijam-part
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { assessmentType: { $regex: search, $options: "i" } },
      ];
    }
<<<<<<< HEAD
=======

>>>>>>> nijam-part
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
<<<<<<< HEAD
    const total = await Assessment.countDocuments(filter);
=======

    const total = await Assessment.countDocuments(filter);

>>>>>>> nijam-part
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
<<<<<<< HEAD
 * Get Assessment By ID
=======
 * @desc    Get assessment by ID
 * @route   GET /api/assessment/:id
 * @access  Private
>>>>>>> nijam-part
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
<<<<<<< HEAD
=======

>>>>>>> nijam-part
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
<<<<<<< HEAD
=======

>>>>>>> nijam-part
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }
<<<<<<< HEAD
=======

>>>>>>> nijam-part
    // Check if user owns this assessment
    if (assessment.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this assessment",
      });
    }
<<<<<<< HEAD
=======

    console.log("Returning assessment:", {
      id: assessment._id,
      generatedContent: assessment.generatedContent,
      hasActivity: assessment.hasActivity,
      hasRubric: assessment.hasRubric,
    });

>>>>>>> nijam-part
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
<<<<<<< HEAD
 * Delete Assessment
=======
 * @desc    Delete assessment
 * @route   DELETE /api/assessment/:id
 * @access  Private
>>>>>>> nijam-part
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
<<<<<<< HEAD
    const assessment = await Assessment.findById(req.params.id);
=======

    const assessment = await Assessment.findById(req.params.id);

>>>>>>> nijam-part
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }
<<<<<<< HEAD
=======

>>>>>>> nijam-part
    // Check if user owns this assessment
    if (assessment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this assessment",
      });
    }
<<<<<<< HEAD
=======

>>>>>>> nijam-part
    // Also update the lesson plan status when deleting assessment
    if (assessment.lessonPlanId) {
      try {
        // Check if this is the only assessment for this lesson plan
        const otherAssessments = await Assessment.countDocuments({
          lessonPlanId: assessment.lessonPlanId,
          _id: { $ne: assessment._id },
        });
<<<<<<< HEAD
=======

>>>>>>> nijam-part
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
<<<<<<< HEAD
    await assessment.deleteOne();
=======

    await assessment.deleteOne();

>>>>>>> nijam-part
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
<<<<<<< HEAD
 * Update Assessment
=======
 * @desc    Update assessment status and generated content
 * @route   PUT /api/assessment/:id
 * @access  Private
>>>>>>> nijam-part
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
<<<<<<< HEAD
=======

>>>>>>> nijam-part
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
<<<<<<< HEAD
    const assessment = await Assessment.findById(req.params.id);
=======

    const assessment = await Assessment.findById(req.params.id);

>>>>>>> nijam-part
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }
<<<<<<< HEAD
=======

>>>>>>> nijam-part
    // Check if user owns this assessment
    if (assessment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this assessment",
      });
    }
<<<<<<< HEAD
=======

>>>>>>> nijam-part
    // Update fields
    if (title) assessment.title = title;
    if (description) assessment.description = description;
    if (generatedContent) assessment.generatedContent = generatedContent;
    if (status) assessment.status = status;
    if (hasActivity !== undefined) assessment.hasActivity = hasActivity;
    if (hasRubric !== undefined) assessment.hasRubric = hasRubric;
    if (notes) assessment.notes = notes;
    if (tags) assessment.tags = tags;
<<<<<<< HEAD
=======

>>>>>>> nijam-part
    // Validate activity type if provided
    if (rawActivityType) {
      assessment.activityType = validateAndMapActivityType(rawActivityType);
    }
<<<<<<< HEAD
    // Update usage tracking
    assessment.usageCount += 1;
    assessment.lastUsed = new Date();
    await assessment.save();
=======

    // Update usage tracking
    assessment.usageCount += 1;
    assessment.lastUsed = new Date();

    await assessment.save();

>>>>>>> nijam-part
    // Return populated assessment
    const updatedAssessment = await Assessment.findById(assessment._id)
      .populate("lessonPlanId", "parameters plan")
      .populate("classId", "className grade subject")
      .populate("createdBy", "name");
<<<<<<< HEAD
=======

>>>>>>> nijam-part
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

<<<<<<< HEAD
/**
 * Regenerate Assessment
 */
const regenerateAssessment = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found in request.",
      });
    }
    const assessmentId = req.params.id;
    const { lessonPlanData, activityFormData } = req.body;
    console.log("Regenerating assessment:", {
      assessmentId,
      lessonPlanData,
      activityFormData,
    });
    // Find the existing assessment
    const existingAssessment = await Assessment.findById(assessmentId);
    if (!existingAssessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }
    // Check if user owns this assessment
    if (existingAssessment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to regenerate this assessment",
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
          "No Gemini API key found. Please add your API key in profile settings.",
      });
    }
    // Extract activity type and validate mapping
    const rawActivityType =
      activityFormData.activityType || existingAssessment.activityType;
    const activityType = validateAndMapActivityType(rawActivityType);
    console.log(
      `Regenerating with activity type validation: "${rawActivityType}" -> "${activityType}"`
    );
    // Prepare generation data
    const generationData = {
      ...lessonPlanData,
      geminiApiKey,
      ...activityFormData,
    };
    // Generate new content using the generator service
    const generator = new AssessmentGenerator(geminiApiKey);
    const generatedContent = await generator.generateByType(
      activityType,
      generationData
    );
    console.log(
      "Generated new content for regeneration:",
      Object.keys(generatedContent)
    );
    // Structure the new content properly based on activity type
    const structuredContent = structureGeneratedContent(
      generatedContent,
      activityType,
      { paperType: activityFormData.paperType }
    );
    console.log("Structured regenerated content:", {
      activityHTML: !!structuredContent.activityHTML,
      rubricHTML: !!structuredContent.rubricHTML,
      assessmentHTML: !!structuredContent.assessmentHTML,
      answerKeyHTML: !!structuredContent.answerKeyHTML,
    });
    // Update the existing assessment with new content and metadata
    const updateData = {
      // Update title to indicate regeneration
      title:
        lessonPlanData.assessmentTitle ||
        existingAssessment.title + " (Regenerated)",
      description:
        lessonPlanData.assessmentDescription || existingAssessment.description,
      // Update activity type if changed
      activityType: activityType,
      // Replace the generated content entirely
      generatedContent: structuredContent,
      // Update lesson plan snapshot if provided
      ...(lessonPlanData.contentStandard && {
        lessonPlanSnapshot: {
          title: lessonPlanData.lesson,
          subject: lessonPlanData.subject,
          grade: lessonPlanData.grade,
          contentStandard: lessonPlanData.contentStandard,
          learningStandard: lessonPlanData.learningStandard,
          learningOutline: lessonPlanData.learningOutline,
        },
      }),
      // Update status and flags
      status: "Generated",
      hasActivity: structuredContent.hasStudentContent,
      hasRubric: structuredContent.hasTeacherContent,
      // Update usage tracking
      usageCount: existingAssessment.usageCount + 1,
      lastUsed: new Date(),
      // Add regeneration metadata
      regeneratedAt: new Date(),
      regenerationCount: (existingAssessment.regenerationCount || 0) + 1,
      // Preserve original creation date if this is the first regeneration
      ...(!(existingAssessment.regenerationCount > 0) && {
        originalCreatedAt: existingAssessment.createdAt,
      }),
    };
    console.log("Updating assessment with data:", {
      id: assessmentId,
      newTitle: updateData.title,
      hasNewActivity: updateData.hasActivity,
      hasNewRubric: updateData.hasRubric,
      regenerationCount: updateData.regenerationCount,
    });
    // Update the assessment
    const updatedAssessment = await Assessment.findByIdAndUpdate(
      assessmentId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate({
        path: "lessonPlanId",
        select: "parameters plan",
      })
      .populate({
        path: "classId",
        select: "className grade subject",
      })
      .populate({
        path: "createdBy",
        select: "name",
      });
    if (!updatedAssessment) {
      return res.status(404).json({
        success: false,
        message: "Failed to update assessment",
      });
    }
    console.log("Assessment successfully regenerated:", {
      id: updatedAssessment._id,
      title: updatedAssessment.title,
      hasActivity: updatedAssessment.hasActivity,
      hasRubric: updatedAssessment.hasRubric,
      regenerationCount: updatedAssessment.regenerationCount,
    });
    // Return the updated assessment
    res.status(200).json({
      success: true,
      message: "Assessment regenerated successfully",
      data: updatedAssessment,
      generatedContent: updatedAssessment.generatedContent,
    });
  } catch (error) {
    console.error("Error in regenerateAssessment:", error);
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
      message: "Error regenerating assessment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Export all controller functions
module.exports = {
  generateFromLessonPlan,
  createStandaloneAssessment,
  getStandaloneAssessments,
  updateStandaloneAssessment,
  deleteStandaloneAssessment,
=======
module.exports = {
  generateFromLessonPlan,
>>>>>>> nijam-part
  saveAssessment,
  getUserAssessments,
  getAssessmentById,
  deleteAssessment,
  updateAssessment,
  getLessonPlansWithoutAssessments,
  getUserAssessmentsFiltered,
<<<<<<< HEAD
  regenerateAssessment,
};
=======
};
>>>>>>> nijam-part
