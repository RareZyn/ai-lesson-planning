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

    // Structure the content properly based on activity type
    const structuredContent = structureGeneratedContent(
      generatedContent,
      activityType,
      { paperType: req.body.paperType || activityData.paperType }
    );

    console.log("📦 Creating lesson-based assessment with data:", {
      title: assessmentTitle || `${lesson} - ${activityType}`,
      activityType,
      lessonPlanId,
      classId,
      createdBy: req.user.id,
      hasStudentContent: structuredContent.hasStudentContent,
      hasTeacherContent: structuredContent.hasTeacherContent,
    });

    // Save assessment to database with proper content structure
    const assessmentData = {
      title: assessmentTitle || `${lesson} - ${activityType}`,
      description:
        assessmentDescription || `Generated ${activityType} assessment`,
      createdBy: req.user.id,
      lessonPlanId,
      classId,
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
    res.status(201).json({
      success: true,
      message: `${activityType} assessment generated and saved successfully`,
      data: assessment,
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

    res.status(500).json({
      success: false,
      message: "Error generating assessment from lesson plan",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

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

/**
 * Get User Assessments Filtered
 */
const getUserAssessmentsFiltered = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      classId,
      lessonPlanId,
      activityType: rawActivityType,
      status,
      search,
      hasLessonPlan,
    } = req.query;

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

    console.log("📋 Assessment filter query:", filter);

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
    res.status(500).json({
      success: false,
      message: "Error fetching assessments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Save Assessment
 */
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
      activityType: activityType,
      assessmentType: assessmentType || "General Assessment",
      questionCount: questionCount,
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
 * Get User Assessments
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
      lessonPlanId,
      activityType: rawActivityType,
      status,
      search,
    } = req.query;
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
 * Get Assessment By ID
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
 * Delete Assessment
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
 * Update Assessment
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
  saveAssessment,
  getUserAssessments,
  getAssessmentById,
  deleteAssessment,
  updateAssessment,
  getLessonPlansWithoutAssessments,
  getUserAssessmentsFiltered,
  regenerateAssessment,
};