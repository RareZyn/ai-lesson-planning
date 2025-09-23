// Enhanced backend/controller/assessmentController.js - Added standalone assessment support
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Assessment = require("../model/Assessment");
const LessonPlan = require("../model/Lesson");
const User = require("../model/User");

const ACTIVITY_TYPE_MAPPING = {
  activityInClass: "activityInClass",
  essay: "essay",
  textbook: "textbook",
  assessment: "assessment",
  "spm-exam": "spm-exam",
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

const structureGeneratedContent = (
  generatedContent,
  activityType,
  additionalData = {}
) => {
  console.log("Structuring content for activity type:", activityType);
  console.log("Raw generated content:", Object.keys(generatedContent));

  // Initialize the content structure
  const structuredContent = {
    activityContent: null,
    rubricContent: null,
    assessmentContent: null,
    answerKeyContent: null,
    examContent: null,
    activityHTML: null,
    rubricHTML: null,
    assessmentHTML: null,
    answerKeyHTML: null,
    examHTML: null, // CRITICAL: This was missing
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

      // Convert JSON to HTML for frontend
      if (structuredContent.assessmentContent) {
        console.log("Converting assessmentContent to HTML...");
        structuredContent.assessmentHTML = convertAssessmentToHTML(
          structuredContent.assessmentContent
        );
        console.log(
          "Assessment HTML generated:",
          !!structuredContent.assessmentHTML
        );
      }
      if (structuredContent.answerKeyContent) {
        console.log("Converting answerKeyContent to HTML...");
        structuredContent.answerKeyHTML = convertAnswerKeyToHTML(
          structuredContent.answerKeyContent
        );
        console.log(
          "Answer Key HTML generated:",
          !!structuredContent.answerKeyHTML
        );
      }

      structuredContent.hasStudentContent =
        !!generatedContent.assessmentContent;
      structuredContent.hasTeacherContent = !!generatedContent.answerKeyContent;

      console.log("Assessment content structured:", {
        hasAssessmentContent: !!structuredContent.assessmentContent,
        hasAnswerKeyContent: !!structuredContent.answerKeyContent,
        hasAssessmentHTML: !!structuredContent.assessmentHTML,
        hasAnswerKeyHTML: !!structuredContent.answerKeyHTML,
      });
      break;

    case "spm-exam":
      structuredContent.examContent = generatedContent.examContent || null;
      structuredContent.answerKeyContent =
        generatedContent.answerKeyContent || null;
      structuredContent.assessmentContent =
        generatedContent.examContent || null;

      // Convert JSON to HTML for frontend
      if (structuredContent.examContent) {
        console.log("Converting examContent to HTML...");
        const examHTML = convertExamToHTML(
          structuredContent.examContent,
          additionalData.paperType || "paper1"
        );

        // CRITICAL: Store HTML in BOTH examHTML and assessmentHTML fields
        structuredContent.examHTML = examHTML;
        structuredContent.assessmentHTML = examHTML; // Frontend compatibility

        console.log("Exam HTML generated:", !!structuredContent.examHTML);
        console.log(
          "Assessment HTML generated:",
          !!structuredContent.assessmentHTML
        );
      }

      if (structuredContent.answerKeyContent) {
        console.log("Converting exam answerKeyContent to HTML...");
        structuredContent.answerKeyHTML = convertAnswerKeyToHTML(
          structuredContent.answerKeyContent
        );
        console.log(
          "Exam Answer Key HTML generated:",
          !!structuredContent.answerKeyHTML
        );
      }

      // CRITICAL: Set flags correctly for SPM exams
      structuredContent.hasStudentContent = !!generatedContent.examContent;
      structuredContent.hasTeacherContent = !!generatedContent.answerKeyContent;

      console.log("Exam content structured:", {
        hasExamContent: !!structuredContent.examContent,
        hasAssessmentContent: !!structuredContent.assessmentContent, // Should also be true
        hasAnswerKeyContent: !!structuredContent.answerKeyContent,
        hasExamHTML: !!structuredContent.examHTML,
        hasAssessmentHTML: !!structuredContent.assessmentHTML, // Should also be true
        hasAnswerKeyHTML: !!structuredContent.answerKeyHTML,
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

      // Convert JSON to HTML for frontend
      if (structuredContent.activityContent) {
        console.log("Converting activityContent to HTML...");
        const htmlResult = convertActivityToHTML(
          structuredContent.activityContent,
          activityType
        );
        structuredContent.activityHTML = htmlResult;
        console.log(
          "Activity HTML generated:",
          !!structuredContent.activityHTML
        );
      }

      if (structuredContent.rubricContent) {
        console.log("Converting rubricContent to HTML...");
        const rubricHtmlResult = convertRubricToHTML(
          structuredContent.rubricContent
        );
        structuredContent.rubricHTML = rubricHtmlResult;
        console.log("Rubric HTML generated:", !!structuredContent.rubricHTML);
      }

      structuredContent.hasStudentContent = !!generatedContent.activityContent;
      structuredContent.hasTeacherContent = !!generatedContent.rubricContent;

      console.log("Activity content structured:", {
        hasActivityContent: !!structuredContent.activityContent,
        hasRubricContent: !!structuredContent.rubricContent,
        hasActivityHTML: !!structuredContent.activityHTML,
        hasRubricHTML: !!structuredContent.rubricHTML,
      });
      break;
  }

  console.log("Final structured content keys:", Object.keys(structuredContent));
  console.log("Final HTML content status:", {
    activityHTML: !!structuredContent.activityHTML,
    rubricHTML: !!structuredContent.rubricHTML,
    assessmentHTML: !!structuredContent.assessmentHTML,
    answerKeyHTML: !!structuredContent.answerKeyHTML,
    examHTML: !!structuredContent.examHTML,
  });

  return structuredContent;
};

// [All existing HTML conversion functions remain the same - keeping them for brevity]
const convertActivityToHTML = (activityContent, activityType) => {
  if (!activityContent) return null;

  let html = `
    <div class="activity-content" style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
      <div class="activity-header" style="border-bottom: 2px solid #1890ff; padding-bottom: 15px; margin-bottom: 20px;">
        <h1 style="color: #1890ff; margin-bottom: 10px;">${
          activityContent.title || "Activity"
        }</h1>
        <div class="student-info" style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
          <p><strong>Name:</strong> ___________________ <strong>Class:</strong> ___________ <strong>Date:</strong> ___________</p>
        </div>
      </div>
  `;

  if (activityContent.description) {
    html += `<div class="activity-description" style="margin-bottom: 20px; padding: 15px; background: #e8f4fd; border-radius: 8px;">
      <p style="margin: 0;"><strong>Description:</strong> ${activityContent.description}</p>
    </div>`;
  }

  if (activityContent.duration) {
    html += `<p style="margin-bottom: 15px;"><strong>Duration:</strong> ${activityContent.duration}</p>`;
  }

  if (activityContent.materials && activityContent.materials.length > 0) {
    html += `<div class="materials" style="margin-bottom: 20px;">
      <h3 style="color: #52c41a;">Materials Needed:</h3>
      <ul>`;
    activityContent.materials.forEach((material) => {
      html += `<li>${material}</li>`;
    });
    html += `</ul></div>`;
  }

  if (activityContent.instructions && activityContent.instructions.length > 0) {
    html += `<div class="instructions" style="margin-bottom: 25px;">
      <h3 style="color: #fa8c16;">Instructions:</h3>
      <ol style="padding-left: 20px;">`;
    activityContent.instructions.forEach((instruction) => {
      html += `<li style="margin-bottom: 8px;">${instruction}</li>`;
    });
    html += `</ol></div>`;
  }

  // Activity-specific content based on type
  switch (activityType) {
    case "essay":
      if (activityContent.prompt) {
        html += `<div class="essay-prompt" style="margin-bottom: 20px; padding: 20px; background: #fff7e6; border: 2px solid #ffa940; border-radius: 8px;">
          <h3 style="color: #fa8c16;">Essay Prompt:</h3>
          <p style="font-size: 16px; font-weight: 500;">${activityContent.prompt}</p>
        </div>`;
      }
      if (activityContent.requirements) {
        html += `<div class="requirements" style="margin-bottom: 20px;">
          <h3 style="color: #1890ff;">Requirements:</h3>
          <ul>
            <li><strong>Word Count:</strong> ${activityContent.requirements.wordCount}</li>
            <li><strong>Duration:</strong> ${activityContent.requirements.duration}</li>
            <li><strong>Format:</strong> ${activityContent.requirements.format}</li>
          </ul>
        </div>`;
      }
      if (activityContent.guidelines && activityContent.guidelines.length > 0) {
        html += `<div class="guidelines" style="margin-bottom: 20px;">
          <h3 style="color: #722ed1;">Guidelines:</h3>
          <ul>`;
        activityContent.guidelines.forEach((guideline) => {
          html += `<li>${guideline}</li>`;
        });
        html += `</ul></div>`;
      }
      break;

    case "activity":
      if (activityContent.activities && activityContent.activities.length > 0) {
        activityContent.activities.forEach((section) => {
          html += `<div class="activity-section" style="margin-bottom: 25px; padding: 15px; border: 1px solid #d9d9d9; border-radius: 8px;">
            <h3 style="color: #52c41a; border-bottom: 1px solid #b7eb8f; padding-bottom: 8px;">${section.section}</h3>
            <ol style="padding-left: 20px;">`;
          section.tasks.forEach((task) => {
            html += `<li style="margin-bottom: 10px;">${task}</li>`;
          });
          html += `</ol></div>`;
        });
      }
      break;

    case "textbook":
      if (activityContent.textbookReference) {
        html += `<div class="textbook-reference" style="margin-bottom: 20px; padding: 15px; background: #f6ffed; border: 1px solid #b7eb8f; border-radius: 8px;">
          <h3 style="color: #52c41a;">Textbook Reference:</h3>
          <p><strong>Pages:</strong> ${
            activityContent.textbookReference.pages
          }</p>
          <p><strong>Chapter:</strong> ${
            activityContent.textbookReference.chapter
          }</p>
          ${
            activityContent.textbookReference.section
              ? `<p><strong>Section:</strong> ${activityContent.textbookReference.section}</p>`
              : ""
          }
        </div>`;
      }

      if (
        activityContent.preActivity &&
        activityContent.preActivity.length > 0
      ) {
        html += `<div class="pre-activity" style="margin-bottom: 20px;">
          <h3 style="color: #1890ff;">Pre-Activity Tasks:</h3>
          <ol>`;
        activityContent.preActivity.forEach((task) => {
          html += `<li>${task}</li>`;
        });
        html += `</ol></div>`;
      }

      if (
        activityContent.mainActivity &&
        activityContent.mainActivity.length > 0
      ) {
        html += `<div class="main-activity" style="margin-bottom: 20px;">
          <h3 style="color: #fa8c16;">Main Activity Tasks:</h3>
          <ol>`;
        activityContent.mainActivity.forEach((task) => {
          html += `<li>${task}</li>`;
        });
        html += `</ol></div>`;
      }

      if (
        activityContent.postActivity &&
        activityContent.postActivity.length > 0
      ) {
        html += `<div class="post-activity" style="margin-bottom: 20px;">
          <h3 style="color: #722ed1;">Post-Activity Tasks:</h3>
          <ol>`;
        activityContent.postActivity.forEach((task) => {
          html += `<li>${task}</li>`;
        });
        html += `</ol></div>`;
      }

      if (activityContent.questions && activityContent.questions.length > 0) {
        html += `<div class="questions" style="margin-bottom: 20px;">
          <h3 style="color: #eb2f96;">Questions:</h3>`;
        activityContent.questions.forEach((question, index) => {
          html += `<div style="margin-bottom: 15px; padding: 10px; border: 1px solid #f0f0f0; border-radius: 5px;">
            <p><strong>Question ${index + 1} (${question.type}):</strong> ${
            question.question
          }</p>
            <div style="height: 60px; border: 1px solid #d9d9d9; margin-top: 10px; background: #fafafa;"></div>
          </div>`;
        });
        html += `</div>`;
      }
      break;
  }

  html += `</div>`;
  return html;
};

const convertAssessmentToHTML = (assessmentContent) => {
  if (!assessmentContent) return null;

  let html = `
    <div class="assessment-content" style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
      <div class="assessment-header" style="border-bottom: 2px solid #1890ff; padding-bottom: 15px; margin-bottom: 20px;">
        <h1 style="color: #1890ff; margin-bottom: 10px;">${
          assessmentContent.title || "Assessment"
        }</h1>
        <div class="student-info" style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
          <p><strong>Name:</strong> ___________________ <strong>Class:</strong> ___________ <strong>Date:</strong> ___________</p>
        </div>
        <div class="assessment-info" style="background: #e6f7ff; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
          <p><strong>Time Allocation:</strong> ${
            assessmentContent.timeAllocation || "60 minutes"
          }</p>
          <p style="margin: 0;"><strong>Total Questions:</strong> ${
            assessmentContent.totalQuestions || "N/A"
          }</p>
        </div>
      </div>
  `;

  if (assessmentContent.instructions) {
    html += `<div class="instructions" style="margin-bottom: 25px; padding: 15px; background: #fff7e6; border: 1px solid #ffa940; border-radius: 8px;">
      <h3 style="color: #fa8c16;">Instructions:</h3>
      <ul style="margin: 0; padding-left: 20px;">`;
    assessmentContent.instructions.forEach((instruction) => {
      html += `<li style="margin-bottom: 5px;">${instruction}</li>`;
    });
    html += `</ul></div>`;
  }

  if (assessmentContent.questions && assessmentContent.questions.length > 0) {
    html += `<div class="questions">`;
    assessmentContent.questions.forEach((question) => {
      html += `<div class="question" style="margin-bottom: 25px; padding: 15px; border: 1px solid #d9d9d9; border-radius: 8px;">
        <h4 style="color: #262626; margin-bottom: 10px;">Question ${
          question.questionNumber
        } (${question.points} ${
        question.points === 1 ? "point" : "points"
      })</h4>
        <p style="font-size: 16px; margin-bottom: 15px;">${
          question.question
        }</p>`;

      if (question.type === "multiple_choice" && question.options) {
        html += `<div class="options" style="margin-left: 20px;">`;
        question.options.forEach((option) => {
          html += `<p style="margin-bottom: 8px;">${option}</p>`;
        });
        html += `</div>`;
      } else if (question.answerSpace) {
        const height =
          question.answerSpace === "3 lines"
            ? "80px"
            : question.answerSpace === "5 lines"
            ? "120px"
            : "60px";
        html += `<div class="answer-space" style="height: ${height}; border: 1px solid #d9d9d9; margin: 15px 0; background: #fafafa; border-radius: 4px;"></div>`;
      } else {
        html += `<div class="answer-space" style="height: 80px; border: 1px solid #d9d9d9; margin: 15px 0; background: #fafafa; border-radius: 4px;"></div>`;
      }

      html += `</div>`;
    });
    html += `</div>`;
  }

  html += `</div>`;
  return html;
};

const convertRubricToHTML = (rubricContent) => {
  if (!rubricContent) return null;

  let html = `
    <div class="rubric-content" style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.5;">
      <h1 style="color: #52c41a; margin-bottom: 10px;">${
        rubricContent.title || "Assessment Rubric"
      }</h1>
      ${
        rubricContent.description
          ? `<p style="margin-bottom: 20px; font-style: italic;">${rubricContent.description}</p>`
          : ""
      }
  `;

  if (rubricContent.criteria && rubricContent.criteria.length > 0) {
    html += `
      <table class="rubric-table" border="1" cellpadding="12" cellspacing="0" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #52c41a; color: white;">
            <th style="text-align: left; font-weight: bold;">Criteria</th>
            <th style="text-align: center; font-weight: bold;">Excellent</th>
            <th style="text-align: center; font-weight: bold;">Good</th>
            <th style="text-align: center; font-weight: bold;">Satisfactory</th>
            <th style="text-align: center; font-weight: bold;">Needs Improvement</th>
            <th style="text-align: center; font-weight: bold;">Points</th>
          </tr>
        </thead>
        <tbody>`;

    rubricContent.criteria.forEach((criterion, index) => {
      const bgColor = index % 2 === 0 ? "#f6ffed" : "#ffffff";
      html += `
        <tr style="background-color: ${bgColor};">
          <td style="font-weight: bold; vertical-align: top;">${criterion.category}</td>
          <td style="vertical-align: top; text-align: left;">${criterion.excellent}</td>
          <td style="vertical-align: top; text-align: left;">${criterion.good}</td>
          <td style="vertical-align: top; text-align: left;">${criterion.satisfactory}</td>
          <td style="vertical-align: top; text-align: left;">${criterion.needsImprovement}</td>
          <td style="text-align: center; font-weight: bold; vertical-align: top;">${criterion.points}</td>
        </tr>`;
    });

    html += `
        </tbody>
      </table>
      <div class="grading-info" style="margin-top: 25px; padding: 15px; background: #e6f7ff; border-radius: 8px;">
        <h3 style="color: #1890ff; margin-bottom: 15px;">Grading Information</h3>
        <p><strong>Total Points:</strong> ${
          rubricContent.totalPoints || "N/A"
        }</p>`;

    if (rubricContent.gradingScale) {
      html += `<h4 style="margin-top: 15px; color: #1890ff;">Grading Scale:</h4><ul style="margin: 0; padding-left: 20px;">`;
      Object.entries(rubricContent.gradingScale).forEach(([level, range]) => {
        html += `<li><strong>${
          level.charAt(0).toUpperCase() + level.slice(1)
        }:</strong> ${range}</li>`;
      });
      html += `</ul>`;
    }

    html += `</div>`;
  }

  html += `</div>`;
  return html;
};

const convertAnswerKeyToHTML = (answerKeyContent) => {
  if (!answerKeyContent) return null;

  let html = `
    <div class="answer-key-content" style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
      <h1 style="color: #52c41a; margin-bottom: 10px;">${
        answerKeyContent.title || "Answer Key"
      }</h1>
      <div class="answer-key-info" style="background: #f6ffed; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p><strong>Total Questions:</strong> ${
          answerKeyContent.totalQuestions || "N/A"
        }</p>
        <p style="margin: 0;"><strong>Total Points:</strong> ${
          answerKeyContent.totalPoints || "N/A"
        }</p>
      </div>
  `;

  if (answerKeyContent.answers && answerKeyContent.answers.length > 0) {
    html += `<div class="answers">`;
    answerKeyContent.answers.forEach((answer) => {
      html += `
        <div class="answer-item" style="margin-bottom: 20px; padding: 15px; border: 1px solid #d9d9d9; border-radius: 8px;">
          <h3 style="color: #262626; margin-bottom: 10px;">Question ${
            answer.questionNumber
          } (${answer.points} ${answer.points === 1 ? "point" : "points"})</h3>
          <p style="margin-bottom: 10px;"><strong>Correct Answer:</strong> ${
            answer.correctAnswer
          }</p>
          <p style="margin: 0; font-style: italic; color: #666;"><strong>Marking Notes:</strong> ${
            answer.markingNotes
          }</p>
        </div>`;
    });
    html += `</div>`;
  }

  if (answerKeyContent.gradingScale) {
    html += `<div class="grading-scale" style="margin-top: 25px; padding: 15px; background: #e6f7ff; border-radius: 8px;">
      <h3 style="color: #1890ff; margin-bottom: 15px;">Grading Scale:</h3>
      <ul style="margin: 0; padding-left: 20px;">`;
    Object.entries(answerKeyContent.gradingScale).forEach(([level, range]) => {
      html += `<li><strong>${
        level.charAt(0).toUpperCase() + level.slice(1)
      }:</strong> ${range}</li>`;
    });
    html += `</ul></div>`;
  }

  html += `</div>`;
  return html;
};

// NEW: Main standalone assessment creation endpoint
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

    let generatedContent;

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
    };

    console.log("📋 Mock lesson plan data:", mockLessonPlanData);

    // Route to appropriate generation function based on activity type
    switch (activityType) {
      case "activity":
        generatedContent = await generateActivityContent({
          ...mockLessonPlanData,
          geminiApiKey,
          ...activityData,
          activityType: "activity",
        });
        break;

      case "essay":
        generatedContent = await generateEssayContent({
          ...mockLessonPlanData,
          geminiApiKey,
          ...activityData,
        });
        break;

      case "textbook":
        generatedContent = await generateTextbookContent({
          ...mockLessonPlanData,
          geminiApiKey,
          ...activityData,
        });
        break;

      case "assessment":
        generatedContent = await generateAssessmentContent({
          ...mockLessonPlanData,
          geminiApiKey,
          ...activityData,
        });
        break;

      case "spm-exam":
        generatedContent = await generateExamContent({
          ...mockLessonPlanData, 
          geminiApiKey,
          ...activityData,
          paperType: activityData.paperType, // paper1 or paper2
        });
        break;

      default:
        console.warn(
          `Unhandled activity type for standalone: ${activityType}, falling back to activity`
        );
        generatedContent = await generateActivityContent({
          ...mockLessonPlanData,
          geminiApiKey,
          ...activityData,
          activityType: "activity",
        });
        break;
    }

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
      questionCount: activityData.numberOfQuestions || 20,
      duration:
        activityData.timeAllocation || activityData.duration || "60 minutes",
      difficulty: activityData.difficultyLevel || "Intermediate",
      skills: activityData.skills || [],
      ...(activityType === "exam" && {
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

// ENHANCED: Modified existing generateFromLessonPlan to handle both lesson-based and standalone
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

    console.log("📚 Processing lesson-based assessment:", req.body);

    // Validate and map activity type
    const activityType = validateAndMapActivityType(rawActivityType);
    console.log(
      `Activity type validation: "${rawActivityType}" -> "${activityType}"`
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

    // Ensure we have the user properly
    if (!req.user) {
      req.user = { id: "test-user-id" };
    }

    // Structure the content properly based on activity type
    const structuredContent = structureGeneratedContent(
      generatedContent,
      activityType,
      { paperType: activityData.paperType }
    );

    console.log("Creating lesson-based assessment with data:", {
      title: assessmentTitle || `${lesson} - ${activityType}`,
      activityType,
      lessonPlanId,
      classId,
      createdBy: req.user.id,
      structuredContent,
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
      questionCount: activityData.numberOfQuestions || 20,
      duration:
        activityData.timeAllocation || activityData.duration || "60 minutes",
      difficulty: "Intermediate",
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
    };

    console.log("Assessment data to save:", assessmentData);

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
      console.log(`Updated lesson plan ${lessonPlanId} status to generated`);
    } catch (lessonPlanError) {
      console.error("Error updating lesson plan status:", lessonPlanError);
    }

    // Return the complete response with all content
    res.status(201).json({
      success: true,
      message: `${activityType} assessment generated and saved successfully`,
      data: assessment,
      generatedContent: assessment.generatedContent,
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

// NEW: Get standalone assessments only
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

// NEW: Update standalone assessment
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

// NEW: Delete standalone assessment
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

// Get filtered assessments method - ENHANCED to handle both types
const getUserAssessmentsFiltered = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      classId,
      activityType: rawActivityType,
      status,
      search,
      hasLessonPlan, // NEW: Filter parameter to distinguish types
    } = req.query;

    console.log("🔍 Getting filtered assessments:", {
      page,
      limit,
      classId,
      rawActivityType,
      status,
      search,
      hasLessonPlan,
    });

    // Build filter object
    const filter = { createdBy: req.user.id };

    // NEW: Filter by lesson plan presence
    if (hasLessonPlan !== undefined) {
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

// [Keep all existing helper functions for generation - they remain the same]
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

// [Keep all existing prompt building functions - they remain the same]
// [Keep all existing prompt building functions - they remain the same]
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

// [Keep all existing CRUD functions that were already working]
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

    let generatedContent;

    // Route to appropriate generation function based on activity type
    switch (activityType) {
      case "activity":
        generatedContent = await generateActivityContent({
          ...lessonPlanData,
          geminiApiKey,
          ...activityFormData,
          activityType: "activity",
        });
        break;

      case "essay":
        generatedContent = await generateEssayContent({
          ...lessonPlanData,
          geminiApiKey,
          ...activityFormData,
        });
        break;

      case "textbook":
        generatedContent = await generateTextbookContent({
          ...lessonPlanData,
          geminiApiKey,
          ...activityFormData,
        });
        break;

      case "assessment":
        generatedContent = await generateAssessmentContent({
          ...lessonPlanData,
          geminiApiKey,
          ...activityFormData,
        });
        break;

      default:
        console.warn(
          `Unhandled activity type for regeneration: ${activityType}, falling back to activity`
        );
        generatedContent = await generateActivityContent({
          ...lessonPlanData,
          geminiApiKey,
          ...activityFormData,
          activityType: "activity",
        });
        break;
    }

    console.log(
      "Generated new content for regeneration:",
      Object.keys(generatedContent)
    );

    // Structure the new content properly based on activity type
    const structuredContent = structureGeneratedContent(
      generatedContent,
      activityType,
      { paperType: activityData.paperType }
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

const generateExamContent = async (data) => {
  console.log("Generating SPM exam content with data:", data);

  const genAI = new GoogleGenerativeAI(data.geminiApiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.7,
    },
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

    const result = await model.generateContent(prompt);
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

    // Validate required fields for exam
    if (!generatedContent.examContent || !generatedContent.answerKeyContent) {
      console.error("Missing required exam fields:", generatedContent);
      throw new Error("Missing required exam content fields in AI response");
    }

    const result_content = {
      examContent: generatedContent.examContent,
      answerKeyContent: generatedContent.answerKeyContent,
    };

    console.log(`Generated exam content analysis:`, {
      examContent: result_content.examContent ? "Generated" : "Missing",
      answerKeyContent: result_content.answerKeyContent
        ? "Generated"
        : "Missing",
    });

    return result_content;
  } catch (error) {
    console.error("Error in generateExamContent:", error);
    throw error;
  }
};

const buildPaper1Prompt = (data) => {
  return `
# CRITICAL: Generate SPM English Paper 1 (Reading & Use of English) Examination

Create a complete SPM English Paper 1 examination based on the Malaysian KSSM curriculum format with exactly 40 questions across 5 parts.

## Exam Configuration:
- Paper Type: Paper 1 (Reading & Use of English)
- Duration: 1 hour 30 minutes
- Total Questions: 40 questions
- Total Marks: 40 marks
- Grade Level: ${data.grade || "Form 4/5"}
- Reading Level: ${data.readingLevel || "Form 4/5 level"}
- Topics/Themes: ${data.topics?.join(", ") || "General topics"}
- Text Sources: ${data.textSources?.join(", ") || "Mixed sources"}

## Paper Structure Requirements:

**Part 1: Multiple Choice (8 questions, 8 marks)**
- 8 short texts (advertisements, notices, emails, etc.)
- 3 answer choices (A, B, C) for each question
- Focus on understanding main ideas and specific information

**Part 2: Multiple Choice Cloze (10 questions, 10 marks)**  
- 1 passage with 10 gaps
- 4 answer choices (A, B, C, D) for each gap
- Focus: ${data.clozeTestFocus || "grammar and vocabulary"}
- Test grammar structures, vocabulary, and discourse markers

**Part 3: Multiple Choice Reading (8 questions, 8 marks)**
- 1 longer passage (300-400 words)
- 3 answer choices (A, B, C) for each question
- Test inference, main ideas, supporting details, author's purpose

**Part 4: Gapped Text (6 questions, 6 marks)**
- 1 passage with 6 removed sentences
- 8 sentence options (A-H) to choose from
- Test understanding of text organization and coherence

**Part 5: Matching & Information Transfer (8 questions, 8 marks)**
- 1 informational text with multiple sections
- 4 matching questions (match statements to paragraphs)
- 4 information transfer questions (complete sentences with words from text)

## Output Format:

Generate a JSON object with this exact structure:

{
  "examContent": {
    "title": "SPM English Paper 1 (1119/1)",
    "subtitle": "Reading and Use of English",
    "duration": "1 hour 30 minutes",
    "totalQuestions": 40,
    "totalMarks": 40,
    "instructions": [
      "Answer all questions",
      "For each question, choose the best answer and mark it on your answer sheet",
      "Read all texts and questions carefully",
      "Transfer your answers to the answer sheet in pencil"
    ],
    "parts": [
      {
        "partNumber": 1,
        "title": "Part 1",
        "instructions": "Questions 1 to 8. Read the text carefully in each question. Choose the best answer A, B or C.",
        "totalQuestions": 8,
        "marks": 8,
        "questions": [
          {
            "questionNumber": 1,
            "text": "Short text here (advertisement, notice, etc.)",
            "question": "What is the main purpose of this text?",
            "options": ["A) Option 1", "B) Option 2", "C) Option 3"],
            "marks": 1
          }
        ]
      },
      {
        "partNumber": 2,
        "title": "Part 2", 
        "instructions": "Questions 9 to 18. Read the passage carefully and choose the best answer A, B, C or D to fill each blank.",
        "totalQuestions": 10,
        "marks": 10,
        "passage": "Complete passage with numbered gaps (9) to (18)",
        "questions": [
          {
            "questionNumber": 9,
            "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
            "marks": 1
          }
        ]
      },
      {
        "partNumber": 3,
        "title": "Part 3",
        "instructions": "Questions 19 to 26. Read the passage carefully and choose the best answer A, B or C.",
        "totalQuestions": 8, 
        "marks": 8,
        "passage": "Longer reading passage (300-400 words)",
        "questions": [
          {
            "questionNumber": 19,
            "question": "According to the passage...",
            "options": ["A) Option 1", "B) Option 2", "C) Option 3"],
            "marks": 1
          }
        ]
      },
      {
        "partNumber": 4,
        "title": "Part 4",
        "instructions": "Questions 27 to 32. Six sentences have been removed from the passage. Choose from sentences A to H the one which fits each gap. There are two extra sentences you do not need to use.",
        "totalQuestions": 6,
        "marks": 6,
        "passage": "Passage with 6 gaps marked (27) to (32)",
        "sentenceOptions": ["A: Sentence option 1", "B: Sentence option 2", "C: Sentence option 3", "D: Sentence option 4", "E: Sentence option 5", "F: Sentence option 6", "G: Sentence option 7", "H: Sentence option 8"],
        "questions": [
          {
            "questionNumber": 27,
            "gapPosition": "After paragraph 1",
            "marks": 1
          }
        ]
      },
      {
        "partNumber": 5,
        "title": "Part 5", 
        "instructions": "Questions 33 to 40. Read the text and answer the questions that follow.",
        "totalQuestions": 8,
        "marks": 8,
        "passage": "Informational text with clear sections/paragraphs",
        "questions": [
          {
            "questionType": "matching",
            "questionNumbers": "33-36",
            "instructions": "Which paragraph (A-F) describes the views expressed by the teenagers?",
            "questions": [
              {
                "questionNumber": 33,
                "statement": "Statement to match to paragraph",
                "marks": 1
              }
            ]
          },
          {
            "questionType": "information_transfer",
            "questionNumbers": "37-40", 
            "instructions": "Complete the notes using information from the text. Choose no more than one word from the passage for each answer.",
            "questions": [
              {
                "questionNumber": 37,
                "sentence": "Complete this sentence: Many restaurants serve _______ food.",
                "marks": 1
              }
            ]
          }
        ]
      }
    ]
  },
  "answerKeyContent": {
    "title": "ANSWER KEY - SPM English Paper 1 (1119/1)",
    "totalQuestions": 40,
    "totalMarks": 40,
    "answers": [
      {
        "questionNumber": 1,
        "correctAnswer": "B",
        "explanation": "Brief explanation of why this is correct",
        "marks": 1
      }
    ],
    "markingScheme": {
      "part1": "1 mark per correct answer (8 marks total)",
      "part2": "1 mark per correct answer (10 marks total)", 
      "part3": "1 mark per correct answer (8 marks total)",
      "part4": "1 mark per correct answer (6 marks total)",
      "part5": "1 mark per correct answer (8 marks total)"
    },
    "gradingScale": {
      "A": "34-40 marks (85-100%)",
      "B": "28-33 marks (70-84%)", 
      "C": "20-27 marks (50-69%)",
      "D": "12-19 marks (30-49%)",
      "E": "8-11 marks (20-29%)",
      "G": "0-7 marks (0-19%)"
    }
  }
}

Remember: Generate exactly 40 questions following the SPM format precisely. Each part must have the correct number of questions and follow authentic SPM style and difficulty.
`;
};

const buildPaper2Prompt = (data) => {
  return `
# CRITICAL: Generate SPM English Paper 2 (Writing) Examination

Create a complete SPM English Paper 2 examination based on the Malaysian KSSM curriculum format.

## Exam Configuration:
- Paper Type: Paper 2 (Writing)
- Duration: 1 hour 30 minutes
- Total Parts: 3 parts
- Total Marks: 60 marks
- Grade Level: ${data.grade || "Form 4/5"}
- Communication Format: ${data.communicationFormat || "Mixed formats"}
- Essay Types: ${data.essayTypes?.join(", ") || "Mixed types"}
- Topic Categories: ${data.topicCategories?.join(", ") || "General topics"}
- Prompt Complexity: ${data.promptComplexity || "Intermediate"}

## Paper Structure Requirements:

**Part 1: Short Communicative Message (20 marks)**
- Format: ${data.communicationFormat || "Email/Letter/Note"}
- Word Count: About 80 words
- Task: Respond to a given message/situation
- Focus: Clear communication, appropriate format, accurate information

**Part 2: Guided Writing (20 marks)**
- Format: Essay with guided points
- Word Count: 125-150 words  
- Task: Write based on given notes/points
- Focus: Content development, organization, language accuracy

**Part 3: Extended Writing (20 marks)**
- Format: Choose 1 from 3 options (${
    data.essayTypes?.join("/") || "Article/Report/Story"
  })
- Word Count: 200-250 words
- Task: Creative/informative writing with given prompts
- Focus: Content, organization, language range, communicative achievement

## Assessment Criteria:
- Content: Relevance to task, completeness of response
- Communicative Achievement: Clear communication, appropriate register
- Organisation: Logical structure, coherent flow
- Language: Grammar accuracy, vocabulary range, spelling

## Output Format:

Generate a JSON object with this exact structure:

{
  "examContent": {
    "title": "SPM English Paper 2 (1119/2)", 
    "subtitle": "Writing",
    "duration": "1 hour 30 minutes",
    "totalParts": 3,
    "totalMarks": 60,
    "instructions": [
      "Answer all questions",
      "Write your answers in the spaces provided",
      "Pay attention to word limits for each part",
      "Plan your time carefully: Part 1 (25 min), Part 2 (30 min), Part 3 (35 min)"
    ],
    "parts": [
      {
        "partNumber": 1,
        "title": "Part 1: Short Communicative Message",
        "marks": 20,
        "wordCount": "About 80 words",
        "timeAllocation": "25 minutes",
        "instructions": "You must answer this question.",
        "scenario": "Detailed scenario/context here",
        "task": "Write an email/letter/note responding to the given situation",
        "requiredContent": [
          "Point 1 to address",
          "Point 2 to address", 
          "Point 3 to address",
          "Point 4 to address"
        ],
        "format": "${data.communicationFormat || "Email"}",
        "writingSpace": "Lined space for approximately 80 words"
      },
      {
        "partNumber": 2,
        "title": "Part 2: Guided Writing",
        "marks": 20,
        "wordCount": "125-150 words", 
        "timeAllocation": "30 minutes",
        "instructions": "You must answer this question.",
        "topic": "Essay topic related to current issues/themes",
        "guidingPoints": [
          "Point 1 to discuss",
          "Point 2 to elaborate",
          "Point 3 to explain"
        ],
        "taskInstructions": "Use all the notes above and give reasons for your point of view. Write your essay in an appropriate style.",
        "writingSpace": "Lined space for approximately 125-150 words"
      },
      {
        "partNumber": 3,
        "title": "Part 3: Extended Writing", 
        "marks": 20,
        "wordCount": "200-250 words",
        "timeAllocation": "35 minutes",
        "instructions": "Choose one of the following questions. Answer in 200-250 words in an appropriate style.",
        "options": [
          {
            "questionNumber": "3A",
            "type": "${data.essayTypes?.[0] || "Article"}",
            "topic": "Engaging topic for article writing",
            "prompt": "Detailed writing prompt with context and requirements",
            "notes": [
              "Key point 1 to include",
              "Key point 2 to develop",
              "Key point 3 to discuss"
            ]
          },
          {
            "questionNumber": "3B", 
            "type": "${data.essayTypes?.[1] || "Report"}",
            "topic": "Professional report topic",
            "prompt": "Report writing scenario with specific requirements",
            "notes": [
              "Aspect 1 to report on",
              "Aspect 2 to analyze",
              "Aspect 3 to recommend"
            ]
          },
          {
            "questionNumber": "3C",
            "type": "${data.essayTypes?.[2] || "Story"}",
            "topic": "Creative story prompt",
            "prompt": "Story beginning or scenario to continue/develop",
            "requirements": [
              "Include specific elements",
              "Develop character/plot",
              "Create engaging narrative"
            ]
          }
        ],
        "writingSpace": "Lined space for approximately 200-250 words"
      }
    ]
  },
  "answerKeyContent": {
    "title": "MARKING SCHEME - SPM English Paper 2 (1119/2)",
    "totalMarks": 60,
    "assessmentCriteria": {
      "part1": {
        "marks": 20,
        "criteria": [
          {
            "aspect": "Content",
            "marks": 8,
            "description": "Completeness and relevance of response to all required points"
          },
          {
            "aspect": "Communicative Achievement", 
            "marks": 6,
            "description": "Appropriateness of format, register, and tone"
          },
          {
            "aspect": "Organisation",
            "marks": 3,
            "description": "Logical structure and coherent flow"
          },
          {
            "aspect": "Language",
            "marks": 3,
            "description": "Grammar accuracy and vocabulary appropriateness"
          }
        ],
        "sampleResponse": "Model answer showing expected content and format",
        "markingNotes": [
          "Award full marks for complete, relevant response",
          "Deduct marks for missing required content",
          "Consider format appropriateness and tone"
        ]
      },
      "part2": {
        "marks": 20,
        "criteria": [
          {
            "aspect": "Content",
            "marks": 9,
            "description": "Development of all guided points with relevant elaboration"
          },
          {
            "aspect": "Organisation",
            "marks": 5,
            "description": "Clear essay structure with introduction, body, conclusion"
          },
          {
            "aspect": "Language",
            "marks": 6,
            "description": "Range and accuracy of vocabulary and grammar"
          }
        ],
        "sampleResponse": "Model essay demonstrating expected development",
        "markingNotes": [
          "All guided points must be addressed",
          "Look for personal opinions and examples",
          "Assess language range and accuracy"
        ]
      },
      "part3": {
        "marks": 20,
        "criteria": [
          {
            "aspect": "Content",
            "marks": 8,
            "description": "Creativity, relevance, and development of ideas"
          },
          {
            "aspect": "Communicative Achievement",
            "marks": 5,
            "description": "Effectiveness in engaging reader and achieving purpose"
          },
          {
            "aspect": "Organisation", 
            "marks": 4,
            "description": "Logical structure appropriate to text type"
          },
          {
            "aspect": "Language",
            "marks": 3,
            "description": "Vocabulary range, grammar accuracy, spelling"
          }
        ],
        "sampleResponses": {
          "article": "Model article response",
          "report": "Model report response", 
          "story": "Model story response"
        },
        "markingNotes": [
          "Assess creativity and originality",
          "Consider appropriateness to chosen format",
          "Evaluate language sophistication"
        ]
      }
    },
    "gradingScale": {
      "A": "51-60 marks (85-100%)",
      "B": "42-50 marks (70-84%)",
      "C": "30-41 marks (50-69%)", 
      "D": "18-29 marks (30-49%)",
      "E": "12-17 marks (20-29%)",
      "G": "0-11 marks (0-19%)"
    }
  }
}

Generate authentic SPM Paper 2 content with realistic scenarios and age-appropriate topics for Form 4/5 students.
`;
};

const convertExamToHTML = (examContent, paperType) => {
  if (!examContent) {
    console.error("No examContent provided to convertExamToHTML");
    return null;
  }

  console.log("Converting exam content to HTML:", {
    paperType,
    hasTitle: !!examContent.title,
    hasSubtitle: !!examContent.subtitle,
    hasParts: !!examContent.parts,
    partsCount: examContent.parts?.length || 0,
  });

  try {
    let html = `
      <div class="exam-content" style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
        <div class="exam-header" style="border-bottom: 2px solid #1890ff; padding-bottom: 15px; margin-bottom: 20px;">
          <h1 style="color: #1890ff; margin-bottom: 5px;">${
            examContent.title || "SPM English Examination"
          }</h1>
          <h2 style="color: #666; margin-bottom: 10px;">${
            examContent.subtitle || "Reading and Use of English"
          }</h2>
          <div class="exam-info" style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
            <p><strong>Name:</strong> ___________________ <strong>IC No.:</strong> ___________________</p>
            <p><strong>Index No.:</strong> ___________________ <strong>Class:</strong> ___________</p>
            <p><strong>Duration:</strong> ${
              examContent.duration || "1 hour 30 minutes"
            }</p>
            ${
              paperType === "paper1"
                ? `<p><strong>Questions:</strong> ${
                    examContent.totalQuestions || 40
                  } <strong>Marks:</strong> ${examContent.totalMarks || 40}</p>`
                : `<p><strong>Parts:</strong> ${
                    examContent.totalParts || 3
                  } <strong>Marks:</strong> ${examContent.totalMarks || 60}</p>`
            }
          </div>
        </div>
    `;

    if (examContent.instructions) {
      html += `<div class="instructions" style="margin-bottom: 25px; padding: 15px; background: #fff7e6; border: 1px solid #ffa940; border-radius: 8px;">
        <h3 style="color: #fa8c16;">Instructions:</h3>
        <ul style="margin: 0; padding-left: 20px;">`;
      examContent.instructions.forEach((instruction) => {
        html += `<li style="margin-bottom: 5px;">${instruction}</li>`;
      });
      html += `</ul></div>`;
    }

    if (paperType === "paper1" && examContent.parts) {
      html += convertPaper1Parts(examContent.parts);
    } else if (paperType === "paper2" && examContent.parts) {
      html += convertPaper2Parts(examContent.parts);
    }

    html += `</div>`;

    console.log("Successfully converted exam to HTML, length:", html.length);
    return html;
  } catch (error) {
    console.error("Error in convertExamToHTML:", error);
    return `<div class="error">Error generating exam HTML: ${error.message}</div>`;
  }
};

const convertPaper1Parts = (parts) => {
  if (!Array.isArray(parts)) {
    console.warn("Parts is not an array:", parts);
    return "";
  }

  let html = "";
  parts.forEach((part, index) => {
    if (!part) return;

    html += `
      <div class="exam-part" style="margin-bottom: 30px; page-break-before: auto;">
        <h3 style="color: #52c41a; border-bottom: 1px solid #b7eb8f; padding-bottom: 8px;">${
          part.title || `Part ${index + 1}`
        }</h3>
        <p style="font-style: italic; margin-bottom: 15px;">${
          part.instructions || ""
        }</p>
        <p style="margin-bottom: 20px;"><strong>Questions ${
          part.questions?.[0]?.questionNumber || part.partNumber || index + 1
        } to ${
      part.questions?.[part.questions?.length - 1]?.questionNumber ||
      (part.totalQuestions
        ? part.totalQuestions + (part.partNumber || index) * 10
        : index + 8)
    }</strong> (${part.marks || 8} marks)</p>
    `;

    if (part.passage) {
      html += `<div class="passage" style="background: #f6ffed; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0;">${part.passage}</p>
      </div>`;
    }

    if (part.questions && Array.isArray(part.questions)) {
      part.questions.forEach((question) => {
        if (!question) return;

        html += `<div class="question" style="margin-bottom: 20px; padding: 10px; border: 1px solid #f0f0f0; border-radius: 5px;">
          <p><strong>${question.questionNumber || ""}.</strong> ${
          question.question || question.text || ""
        }</p>`;

        if (question.options && Array.isArray(question.options)) {
          question.options.forEach((option) => {
            html += `<p style="margin-left: 20px;">${option}</p>`;
          });
        }
        html += `</div>`;
      });
    }

    if (part.sentenceOptions && Array.isArray(part.sentenceOptions)) {
      html += `<div class="sentence-options" style="margin: 20px 0;">
        <h4>Choose from these sentences:</h4>`;
      part.sentenceOptions.forEach((option) => {
        html += `<p style="margin: 5px 0;">${option}</p>`;
      });
      html += `</div>`;
    }

    html += `</div>`;
  });
  return html;
};

// Helper function for Paper 2 parts
const convertPaper2Parts = (parts) => {
  if (!Array.isArray(parts)) {
    console.warn("Parts is not an array:", parts);
    return "";
  }

  let html = "";
  parts.forEach((part, index) => {
    if (!part) return;

    html += `
      <div class="exam-part" style="margin-bottom: 40px; page-break-before: auto;">
        <h3 style="color: #52c41a; border-bottom: 1px solid #b7eb8f; padding-bottom: 8px;">${
          part.title || `Part ${index + 1}`
        }</h3>
        <div class="part-info" style="background: #e6f7ff; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
          <p><strong>Marks:</strong> ${
            part.marks || 20
          } | <strong>Word Count:</strong> ${
      part.wordCount || "Not specified"
    } | <strong>Time:</strong> ${part.timeAllocation || "Not specified"}</p>
        </div>
        <p style="font-style: italic; margin-bottom: 15px;">${
          part.instructions || ""
        }</p>
    `;

    if (part.scenario) {
      html += `<div class="scenario" style="background: #f6ffed; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h4>Scenario:</h4>
        <p>${part.scenario}</p>
      </div>`;
    }

    if (part.task) {
      html += `<p><strong>Task:</strong> ${part.task}</p>`;
    }

    if (part.requiredContent && Array.isArray(part.requiredContent)) {
      html += `<div class="required-content" style="margin: 15px 0;">
        <h4>Your response must include:</h4>
        <ul>`;
      part.requiredContent.forEach((content) => {
        html += `<li>${content}</li>`;
      });
      html += `</ul></div>`;
    }

    if (part.guidingPoints && Array.isArray(part.guidingPoints)) {
      html += `<div class="guiding-points" style="margin: 15px 0;">
        <h4>Use these points in your essay:</h4>
        <ul>`;
      part.guidingPoints.forEach((point) => {
        html += `<li>${point}</li>`;
      });
      html += `</ul></div>`;
    }

    if (part.options && Array.isArray(part.options)) {
      html += `<div class="writing-options" style="margin: 20px 0;">`;
      part.options.forEach((option) => {
        if (!option) return;

        html += `
          <div class="option" style="border: 1px solid #d9d9d9; padding: 15px; margin-bottom: 15px; border-radius: 8px;">
            <h4>${option.questionNumber || ""} - ${
          option.type || "Writing Task"
        }</h4>
            <h5>${option.topic || ""}</h5>
            <p>${option.prompt || ""}</p>
            ${
              option.notes && Array.isArray(option.notes)
                ? `<ul>${option.notes
                    .map((note) => `<li>${note}</li>`)
                    .join("")}</ul>`
                : ""
            }
            ${
              option.requirements && Array.isArray(option.requirements)
                ? `<ul>${option.requirements
                    .map((req) => `<li>${req}</li>`)
                    .join("")}</ul>`
                : ""
            }
          </div>`;
      });
      html += `</div>`;
    }

    // Add writing space
    const lineHeight =
      part.partNumber === 1
        ? "80px"
        : part.partNumber === 2
        ? "120px"
        : "200px";
    html += `<div class="writing-space" style="margin: 20px 0; padding: 15px; border: 1px solid #d9d9d9; border-radius: 5px; background: #fafafa; min-height: ${lineHeight};">
      <p style="color: #666; font-style: italic;">Write your answer here...</p>
    </div>`;

    html += `</div>`;
  });
  return html;
};

// Update the module.exports to include all new standalone functions
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
  generateExamContent,
};
