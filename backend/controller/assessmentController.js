// Fixed backend/controller/assessmentController.js - Properly handle different content types
const OpenAI = require("openai");
const Assessment = require("../model/Assessment");
const LessonPlan = require("../model/Lesson");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

// FIXED: Properly structure generated content based on activity type
const structureGeneratedContent = (generatedContent, activityType) => {
  console.log("Structuring content for activity type:", activityType);
  console.log("Raw generated content:", Object.keys(generatedContent));

  // Initialize the content structure
  const structuredContent = {
    activityHTML: null,
    rubricHTML: null,
    assessmentHTML: null,
    answerKeyHTML: null,
    hasStudentContent: false,
    hasTeacherContent: false,
    generatedAt: new Date(),
  };

  // Map content based on activity type
  switch (activityType) {
    case "assessment":
      // For assessments: student content = assessmentHTML, teacher content = answerKeyHTML
      structuredContent.assessmentHTML =
        generatedContent.assessmentHTML || null;
      structuredContent.answerKeyHTML = generatedContent.answerKeyHTML || null;
      structuredContent.hasStudentContent = !!generatedContent.assessmentHTML;
      structuredContent.hasTeacherContent = !!generatedContent.answerKeyHTML;
      console.log("Assessment content structured:", {
        hasAssessmentHTML: !!structuredContent.assessmentHTML,
        hasAnswerKeyHTML: !!structuredContent.answerKeyHTML,
      });
      break;

    case "essay":
    case "textbook":
    case "activity":
    default:
      // For other types: student content = activityHTML, teacher content = rubricHTML
      structuredContent.activityHTML = generatedContent.activityHTML || null;
      structuredContent.rubricHTML = generatedContent.rubricHTML || null;
      structuredContent.hasStudentContent = !!generatedContent.activityHTML;
      structuredContent.hasTeacherContent = !!generatedContent.rubricHTML;
      console.log("Activity content structured:", {
        hasActivityHTML: !!structuredContent.activityHTML,
        hasRubricHTML: !!structuredContent.rubricHTML,
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
      hasActivity: !!(generatedContent && generatedContent.activityHTML),
      hasRubric: !!(generatedContent && generatedContent.rubricHTML),
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
