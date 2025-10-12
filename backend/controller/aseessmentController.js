// Enhanced backend/controller/assessmentController.js - Added standalone assessment support
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Assessment = require("../model/Assessment");
const LessonPlan = require("../model/Lesson");
const User = require("../model/User");
const { jsonrepair } = require("jsonrepair");
const ACTIVITY_TYPE_MAPPING = {
  activityInClass: "activityInClass",
  essay: "essay",
  textbook: "textbook",
  assessment: "assessment",
  "spm-exam": "spm-exam",
};
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

const convertAnswerKeyToHTML = (answerKeyContent) => {
  if (!answerKeyContent) return null;

  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">${getEnhancedPdfStyles()}</head><body>
    <div class="answer-key-content">
      <h1>${answerKeyContent.title || "Answer Key"}</h1>
      <div class="answer-key-info">
        <p><strong>Questions:</strong> ${
          answerKeyContent.totalQuestions || "N/A"
        } | <strong>Points:</strong> ${
    answerKeyContent.totalPoints || answerKeyContent.totalMarks || "N/A"
  }</p>
      </div>`;

  if (answerKeyContent.answers && answerKeyContent.answers.length > 0) {
    html += `<div class="answers">`;
    answerKeyContent.answers.forEach((answer) => {
      const points = answer.points || answer.marks || 1;

      html += `<div class="answer-item">
        <h4>Question ${answer.questionNumber} (${points} ${
        points === 1 ? "point" : "points"
      })</h4>
        <div style="background: #e6f7ff; border-left: 3px solid #1890ff;">
          <p><strong>Answer:</strong> ${
            answer.correctAnswer || "Not specified"
          }</p>
        </div>`;

      if (
        answer.explanation &&
        answer.explanation !== "undefined" &&
        answer.explanation.trim()
      ) {
        html += `<div style="background: #f6ffed; border-left: 3px solid #52c41a;">
          <p><strong>Explanation:</strong> ${answer.explanation}</p>
        </div>`;
      }

      if (
        answer.markingNotes &&
        answer.markingNotes !== "undefined" &&
        answer.markingNotes.trim()
      ) {
        html += `<div style="background: #fff7e6; border-left: 3px solid #fa8c16;">
          <p><strong>Marking:</strong> ${answer.markingNotes}</p>
        </div>`;
      }

      html += `</div>`;
    });
    html += `</div>`;
  }

  html += `</div></body></html>`;
  return html;
};

const structureGeneratedContent = (
  generatedContent,
  activityType,
  additionalData = {}
) => {
  console.log("🔧 Structuring content for activity type:", activityType);
  console.log("🔧 Raw generated content:", Object.keys(generatedContent));

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
    examHTML: null,
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
        console.log("🔧 Converting assessmentContent to HTML...");
        structuredContent.assessmentHTML = convertAssessmentToHTML(
          structuredContent.assessmentContent
        );
        console.log(
          "✅ Assessment HTML generated:",
          !!structuredContent.assessmentHTML
        );
      }
      if (structuredContent.answerKeyContent) {
        console.log("🔧 Converting answerKeyContent to HTML...");
        structuredContent.answerKeyHTML = convertAnswerKeyToHTML(
          structuredContent.answerKeyContent
        );
        console.log(
          "✅ Answer Key HTML generated:",
          !!structuredContent.answerKeyHTML
        );
      }

      structuredContent.hasStudentContent =
        !!generatedContent.assessmentContent;
      structuredContent.hasTeacherContent = !!generatedContent.answerKeyContent;
      break;

    case "spm-exam":
      console.log("🎯 Processing SPM exam content...");

      structuredContent.examContent = generatedContent.examContent || null;
      structuredContent.answerKeyContent =
        generatedContent.answerKeyContent || null;

      // CRITICAL: Also populate assessmentContent for frontend compatibility
      structuredContent.assessmentContent =
        generatedContent.examContent || null;

      // Convert JSON to HTML for frontend
      if (structuredContent.examContent) {
        console.log("🔧 Converting examContent to HTML...");
        const examHTML = convertExamToHTML(
          structuredContent.examContent,
          additionalData.paperType || "paper1"
        );

        // CRITICAL: Store HTML in BOTH examHTML and assessmentHTML fields
        structuredContent.examHTML = examHTML;
        structuredContent.assessmentHTML = examHTML; // Frontend compatibility

        console.log("✅ Exam HTML generated:", !!structuredContent.examHTML);
        console.log(
          "✅ Assessment HTML (copy) generated:",
          !!structuredContent.assessmentHTML
        );
      }

      if (structuredContent.answerKeyContent) {
        console.log("🔧 Converting exam answerKeyContent to HTML...");
        structuredContent.answerKeyHTML = convertAnswerKeyToHTML(
          structuredContent.answerKeyContent
        );
        console.log(
          "✅ Exam Answer Key HTML generated:",
          !!structuredContent.answerKeyHTML
        );
      }

      // CRITICAL: Set flags correctly for SPM exams
      structuredContent.hasStudentContent = !!generatedContent.examContent;
      structuredContent.hasTeacherContent = !!generatedContent.answerKeyContent;

      console.log("📊 Exam content structured:", {
        hasExamContent: !!structuredContent.examContent,
        hasAssessmentContent: !!structuredContent.assessmentContent,
        hasAnswerKeyContent: !!structuredContent.answerKeyContent,
        hasExamHTML: !!structuredContent.examHTML,
        hasAssessmentHTML: !!structuredContent.assessmentHTML,
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
        console.log("🔧 Converting activityContent to HTML...");
        const htmlResult = convertActivityToHTML(
          structuredContent.activityContent,
          activityType
        );
        structuredContent.activityHTML = htmlResult;
        console.log(
          "✅ Activity HTML generated:",
          !!structuredContent.activityHTML
        );
      }

      if (structuredContent.rubricContent) {
        console.log("🔧 Converting rubricContent to HTML...");
        const rubricHtmlResult = convertRubricToHTML(
          structuredContent.rubricContent
        );
        structuredContent.rubricHTML = rubricHtmlResult;
        console.log(
          "✅ Rubric HTML generated:",
          !!structuredContent.rubricHTML
        );
      }

      structuredContent.hasStudentContent = !!generatedContent.activityContent;
      structuredContent.hasTeacherContent = !!generatedContent.rubricContent;
      break;
  }

  console.log(
    "📦 Final structured content keys:",
    Object.keys(structuredContent)
  );
  console.log("📊 Final HTML content status:", {
    activityHTML: !!structuredContent.activityHTML,
    rubricHTML: !!structuredContent.rubricHTML,
    assessmentHTML: !!structuredContent.assessmentHTML,
    answerKeyHTML: !!structuredContent.answerKeyHTML,
    examHTML: !!structuredContent.examHTML,
  });

  return structuredContent;
};

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

// Enhanced CSS for PDF rendering - prevents page breaks and optimizes spacing
const getEnhancedPdfStyles = () => `
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.3;
      color: #333;
      padding: 15px;
    }
    
    h1 {
      font-size: 15pt;
      margin-bottom: 6px;
      color: #1890ff;
      page-break-after: avoid;
    }
    
    h2, h3 {
      font-size: 12pt;
      margin: 8px 0 4px 0;
      color: #262626;
      page-break-after: avoid;
    }
    
    h4 {
      font-size: 11pt;
      margin: 6px 0 3px 0;
      font-weight: 600;
      page-break-after: avoid;
    }
    
    p {
      margin: 3px 0;
      font-size: 11pt;
    }
    
    /* CRITICAL: Prevent page breaks inside questions */
    .question, .question-wrapper, .answer-item, .exam-part {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      margin-bottom: 8px;
    }
    
    /* Compact info boxes */
    .student-info, .assessment-info, .answer-key-info {
      padding: 4px 6px;
      margin-bottom: 6px;
      background: #f8f9fa;
      border-radius: 3px;
      font-size: 10pt;
    }
    
    .instructions {
      padding: 6px 8px;
      margin-bottom: 8px;
      background: #fff7e6;
      border: 1px solid #ffa940;
      border-radius: 3px;
    }
    
    .instructions ul, .instructions ol {
      margin: 2px 0;
      padding-left: 18px;
    }
    
    .instructions li {
      margin-bottom: 1px;
      font-size: 10pt;
    }
    
    /* Question styling - keeps everything together */
    .question {
      padding: 8px;
      border: 1px solid #e8e8e8;
      border-radius: 3px;
      background: #fafafa;
    }
    
    .options {
      margin: 4px 0 0 12px;
    }
    
    .options p {
      margin: 2px 0;
    }
    
    .answer-space {
      margin: 6px 0;
      border: 1px solid #d9d9d9;
      background: #fafafa;
      border-radius: 2px;
    }
    
    /* Answer key styling */
    .answer-item {
      padding: 8px;
      border: 1px solid #d9d9d9;
      border-radius: 3px;
      background: #fafafa;
      margin-bottom: 8px;
    }
    
    .answer-item > div {
      padding: 5px;
      margin-bottom: 4px;
      border-radius: 2px;
      font-size: 10pt;
    }
    
    /* Table styling */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
      margin: 8px 0;
    }
    
    tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    th, td {
      padding: 4px 6px;
      border: 1px solid #d9d9d9;
      text-align: left;
      font-size: 10pt;
    }
    
    th {
      background: #f0f0f0;
      font-weight: 600;
    }
    
    /* Print optimization */
    @media print {
      body {
        padding: 10mm;
      }
      
      .question, .question-wrapper, .answer-item, .exam-part {
        page-break-inside: avoid !important;
      }
      
      h1, h2, h3, h4 {
        page-break-after: avoid !important;
      }
    }
  </style>
`;

const convertAssessmentContentToHTML = (assessmentContent) => {
  if (!assessmentContent) return null;

  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">${getEnhancedPdfStyles()}</head><body>
    <div class="assessment-content">
      <div class="assessment-header">
        <h1>${assessmentContent.title || "Assessment"}</h1>
        <div class="student-info">
          <p><strong>Name:</strong> _______________ <strong>Class:</strong> _________ <strong>Date:</strong> _________</p>
        </div>
        <div class="assessment-info">
          <p><strong>Time:</strong> ${
            assessmentContent.timeAllocation || "60 minutes"
          } | <strong>Questions:</strong> ${
    assessmentContent.totalQuestions || "N/A"
  }</p>
        </div>
      </div>`;

  if (assessmentContent.instructions) {
    html += `<div class="instructions"><strong>Instructions:</strong><ul>`;
    assessmentContent.instructions.forEach((instruction) => {
      html += `<li>${instruction}</li>`;
    });
    html += `</ul></div>`;
  }

  if (assessmentContent.questions && assessmentContent.questions.length > 0) {
    html += `<div class="questions">`;
    assessmentContent.questions.forEach((question) => {
      html += `<div class="question-wrapper"><div class="question">
        <h4>Question ${question.questionNumber} (${question.points} ${
        question.points === 1 ? "point" : "points"
      })</h4>
        <p>${question.question}</p>`;

      if (question.type === "multiple_choice" && question.options) {
        html += `<div class="options">`;
        question.options.forEach((option) => {
          html += `<p>${option}</p>`;
        });
        html += `</div>`;
      } else if (question.answerSpace) {
        const height =
          question.answerSpace === "3 lines"
            ? "50px"
            : question.answerSpace === "5 lines"
            ? "80px"
            : "40px";
        html += `<div class="answer-space" style="height: ${height};"></div>`;
      } else {
        html += `<div class="answer-space" style="height: 50px;"></div>`;
      }

      html += `</div></div>`;
    });
    html += `</div>`;
  }

  html += `</div></body></html>`;
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

const convertAnswerKeyContentToHTML = (answerKeyContent) => {
  if (!answerKeyContent) return null;

  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">${getEnhancedPdfStyles()}</head><body>
    <div class="answer-key-content">
      <h1>${answerKeyContent.title || "Answer Key"}</h1>
      <div class="answer-key-info">
        <p><strong>Questions:</strong> ${
          answerKeyContent.totalQuestions || "N/A"
        } | <strong>Points:</strong> ${
    answerKeyContent.totalPoints || answerKeyContent.totalMarks || "N/A"
  }</p>
      </div>`;

  if (answerKeyContent.answers && answerKeyContent.answers.length > 0) {
    html += `<div class="answers">`;
    answerKeyContent.answers.forEach((answer) => {
      const points = answer.points || answer.marks || 1;

      html += `<div class="answer-item">
        <h4>Question ${answer.questionNumber} (${points} ${
        points === 1 ? "point" : "points"
      })</h4>
        <div style="background: #e6f7ff; border-left: 3px solid #1890ff;">
          <p><strong>Answer:</strong> ${
            answer.correctAnswer || "Not specified"
          }</p>
        </div>`;

      if (
        answer.explanation &&
        answer.explanation !== "undefined" &&
        answer.explanation.trim()
      ) {
        html += `<div style="background: #f6ffed; border-left: 3px solid #52c41a;">
          <p><strong>Explanation:</strong> ${answer.explanation}</p>
        </div>`;
      }

      if (
        answer.markingNotes &&
        answer.markingNotes !== "undefined" &&
        answer.markingNotes.trim()
      ) {
        html += `<div style="background: #fff7e6; border-left: 3px solid #fa8c16;">
          <p><strong>Marking:</strong> ${answer.markingNotes}</p>
        </div>`;
      }

      html += `</div>`;
    });
    html += `</div>`;
  }

  html += `</div></body></html>`;
  return html;
};
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

      case "spm-exam":
        console.log("🎯 Generating SPM exam content...");

        // Extract SPM-specific data from request body
        const spmExamData = {
          contentStandard,
          learningStandard,
          learningOutline,
          lesson,
          subject,
          theme,
          topic,
          grade,
          geminiApiKey,
          paperType: req.body.paperType || activityData.paperType || "paper1",
          form: req.body.form || activityData.form || grade,
          timeAllocation:
            req.body.timeAllocation || activityData.timeAllocation || "90",
          difficultyLevel:
            req.body.difficultyLevel ||
            activityData.difficultyLevel ||
            "Intermediate",
          textSources: req.body.textSources ||
            activityData.textSources || ["newspapers", "magazines"],
          readingLevel:
            req.body.readingLevel || activityData.readingLevel || grade,
          topics: req.body.topics || activityData.topics || ["general"],
          communicationFormat:
            req.body.communicationFormat ||
            activityData.communicationFormat ||
            "email",
          essayTypes: req.body.essayTypes ||
            activityData.essayTypes || ["descriptive", "narrative"],
          topicCategories: req.body.topicCategories ||
            activityData.topicCategories || ["general"],
          promptComplexity:
            req.body.promptComplexity ||
            activityData.promptComplexity ||
            "moderate",
          questionTypes:
            req.body.questionTypes || activityData.questionTypes || {},
        };

        console.log("📋 SPM exam generation data:", {
          paperType: spmExamData.paperType,
          form: spmExamData.form,
          timeAllocation: spmExamData.timeAllocation,
          textSources: spmExamData.textSources?.length || 0,
          topics: spmExamData.topics?.length || 0,
        });

        generatedContent = await generateExamContent(spmExamData);
        break;

      default:
        console.warn(
          `⚠️ Unhandled activity type: ${activityType}, falling back to activity`
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
      questionCount: activityData.numberOfQuestions || 20,
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

//Update standalone assessment
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

//Delete standalone assessment
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
  console.log("🎯 Generating SPM exam content with data:", {
    paperType: data.paperType,
    lesson: data.lesson,
    subject: data.subject,
    grade: data.grade,
  });

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

    console.log("🚀 Sending request to Gemini AI for", data.paperType);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("📥 Raw AI output length:", text.length);
    console.log("📥 Raw AI output preview:", text.substring(0, 500) + "...");

    if (!text || text.trim().length === 0) {
      throw new Error("Empty response from AI");
    }

    let generatedContent;
    let cleanedText;

    try {
      // Basic cleaning - remove markdown code blocks
      cleanedText = text
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

      generatedContent = JSON.parse(repairedJson);
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
          generatedContent = JSON.parse(repairedReconstructedJson);

          console.log(
            "✅ Successfully extracted and repaired content manually"
          );
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
    console.error("❌ Error in generateExamContent:", error);
    throw error;
  }
};

const buildPaper1Prompt = (data) => {
  return `
# CRITICAL: Generate SPM English Paper 1 (Reading & Use of English) Examination

Create a complete SPM English Paper 1 examination based on the Malaysian KSSM curriculum format with exactly 40 questions across 5 parts.

## Lesson Context:
- Subject: ${data.subject || "English"}
- Topic: ${data.lesson || "English Lesson"}  
- Grade: ${data.grade || "Form 5"}
- Theme: ${data.theme || "General"}
- Learning Focus: ${
    data.learningOutline?.during || "Grammar and vocabulary practice"
  }

## Paper Configuration:
- Paper Type: Paper 1 (Reading & Use of English)
- Duration: ${data.timeAllocation || "90"} minutes
- Total Questions: 40 questions
- Total Marks: 40 marks
- Reading Level: ${data.readingLevel || "Form 5 level"}
- Text Sources: ${data.textSources?.join(", ") || "Mixed authentic sources"}
- Topics: ${
    data.topics?.join(", ") || "Health, environment, people and culture"
  }

## Paper Structure (MANDATORY):

**Part 1: Multiple Choice (8 questions, 8 marks)**
- 8 short texts (notices, emails, signs, advertisements)
- 3 answer choices (A, B, C) for each question
- Focus on understanding main ideas and specific information

**Part 2: Multiple Choice Cloze (10 questions, 10 marks)**  
- 1 passage with 10 gaps numbered (9) to (18)
- 4 answer choices (A, B, C, D) for each gap
- Focus: ${
    data.questionTypes?.clozeTestFocus || "grammar, vocabulary, and discourse"
  }

**Part 3: Multiple Choice Reading (8 questions, 8 marks)**
- 1 longer passage (300-400 words)
- 3 answer choices (A, B, C) for each question (19-26)
- Test inference, main ideas, supporting details, author's purpose

**Part 4: Gapped Text (6 questions, 6 marks)**
- 1 passage with 6 removed sentences numbered (27) to (32)
- 8 sentence options (A-H) to choose from (2 extras)
- Test understanding of text organization and coherence

**Part 5: Matching & Information Transfer (8 questions, 8 marks)**
- 1 informational text with 6 clearly labeled paragraphs (A-F)
- Questions 33-36: Match 4 statements to the correct paragraph letter (A-F)
- Questions 37-40: Complete 4 sentences using EXACTLY ONE WORD from the text

## CRITICAL INSTRUCTIONS FOR PART 5:

### Part 5 Passage Requirements:
1. Write ONE informational passage (350-450 words) divided into EXACTLY 6 paragraphs
2. Label each paragraph clearly as A, B, C, D, E, F
3. Each paragraph should cover a DISTINCT aspect of the topic
4. Make paragraphs substantial (60-80 words each) with specific, extractable information

### Questions 33-36 (Matching) Requirements:
1. Create 4 clear statements that each match ONLY ONE specific paragraph
2. Statements should paraphrase paragraph content, not quote directly
3. Each statement must have an obvious answer from paragraph content
4. Format: "Which paragraph (A-F) discusses [specific topic/information]?"

### Questions 37-40 (Information Transfer) Requirements:
1. Create 4 incomplete sentences that test vocabulary extraction
2. Each sentence must have EXACTLY ONE clear answer word from the passage
3. The missing word must be a key noun, verb, or adjective from the text
4. Format: "Regular exercise helps to reduce _______ levels." (Answer: stress)
5. CRITICAL: Ensure the exact word appears in the passage text

## Output Format:

Return a JSON object with this EXACT structure:

{
  "examContent": {
    "title": "SPM English Paper 1 (1119/1)",
    "subtitle": "Reading and Use of English",
    "duration": "${data.timeAllocation || "90"} minutes",
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
            "text": "Complete short text with question",
            "options": ["A) First option", "B) Second option", "C) Third option"],
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
        "passage": "Complete passage with health/environment topic. The passage must contain 10 numbered gaps (9) to (18) that test grammar and vocabulary. Example: 'Maintaining a healthy lifestyle is crucial for overall well-being. We (9) _______ all prioritize our health...'",
        "questions": [
          {
            "questionNumber": 9,
            "options": ["A) should", "B) must", "C) ought", "D) might"],
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
        "passage": "A complete 350-400 word informative passage about health advice, environmental issues, or cultural topics that connects to the lesson theme",
        "questions": [
          {
            "questionNumber": 19,
            "question": "According to the passage, the main reason people should exercise regularly is",
            "options": ["A) to lose weight quickly", "B) to maintain good health", "C) to become professional athletes"],
            "marks": 1
          }
        ]
      },
      {
        "partNumber": 4,
        "title": "Part 4",
        "instructions": "Questions 27 to 32. Six sentences have been removed from the passage. Choose from sentences A to H the one which fits each gap (27-32). There are two extra sentences you do not need to use.",
        "totalQuestions": 6,
        "marks": 6,
        "passage": "Complete coherent passage (300-350 words) with 6 gaps marked (27), (28), (29), (30), (31), (32) about sustainable living or health topics. Example: 'Living sustainably is important. (27) _______ This involves making conscious choices...'",
        "sentenceOptions": [
          "A: Sentence option that could fit one gap",
          "B: Another sentence option",
          "C: Third sentence option",
          "D: Fourth sentence option",
          "E: Fifth sentence option",
          "F: Sixth sentence option", 
          "G: Extra sentence 1 (distractor)",
          "H: Extra sentence 2 (distractor)"
        ],
        "questions": [
          {
            "questionNumber": 27,
            "gapContext": "Brief context about where gap 27 appears in passage",
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
        "passage": "**CRITICAL: Create ONE complete informational passage (400-450 words) divided into EXACTLY 6 paragraphs labeled A, B, C, D, E, F. Each paragraph should be 60-80 words discussing a distinct aspect of the topic (health/environment/culture). Include specific vocabulary words that can be extracted for questions 37-40.**

Example structure:
A: The benefits of regular exercise (include words like 'stamina', 'cardiovascular', 'flexibility')
B: Importance of balanced nutrition (include words like 'nutrients', 'metabolism', 'deficiency')  
C: Role of adequate sleep (include words like 'rejuvenate', 'cognitive', 'immune')
D: Managing stress effectively (include words like 'meditation', 'cortisol', 'anxiety')
E: Staying hydrated (include words like 'hydration', 'dehydration', 'electrolytes')
F: Regular health check-ups (include words like 'preventive', 'screening', 'diagnosis')",
        "paragraphLabels": ["A", "B", "C", "D", "E", "F"],
        "questions": [
          {
            "questionType": "matching",
            "questionNumbers": "33-36",
            "instructions": "Which paragraph (A-F) contains the following information? Write the correct letter A-F for questions 33-36.",
            "questions": [
              {
                "questionNumber": 33,
                "statement": "The importance of drinking enough water for body functions",
                "correctAnswer": "E",
                "marks": 1
              },
              {
                "questionNumber": 34,
                "statement": "How physical activity strengthens the heart and circulation system",
                "correctAnswer": "A",
                "marks": 1
              },
              {
                "questionNumber": 35,
                "statement": "The benefits of getting sufficient rest for brain function",
                "correctAnswer": "C",
                "marks": 1
              },
              {
                "questionNumber": 36,
                "statement": "Why early detection of health problems is important",
                "correctAnswer": "F",
                "marks": 1
              }
            ]
          },
          {
            "questionType": "information_transfer",
            "questionNumbers": "37-40", 
            "instructions": "Complete the notes below using information from the text. Write NO MORE THAN ONE WORD from the passage for each answer. Write your answers for questions 37-40.",
            "questions": [
              {
                "questionNumber": 37,
                "sentence": "Building physical _______ requires consistent exercise over time.",
                "correctAnswer": "stamina",
                "locationInText": "Paragraph A mentions 'Regular exercise builds stamina...'",
                "marks": 1
              },
              {
                "questionNumber": 38,
                "sentence": "A lack of essential _______ can lead to various health problems.",
                "correctAnswer": "nutrients",
                "locationInText": "Paragraph B states 'Without proper nutrients, the body cannot...'",
                "marks": 1
              },
              {
                "questionNumber": 39,
                "sentence": "Adequate sleep helps to _______ the body and mind.",
                "correctAnswer": "rejuvenate",
                "locationInText": "Paragraph C explains 'Sleep helps rejuvenate both body and mind...'",
                "marks": 1
              },
              {
                "questionNumber": 40,
                "sentence": "_______ care focuses on preventing diseases before they develop.",
                "correctAnswer": "Preventive",
                "locationInText": "Paragraph F discusses 'Preventive care through regular check-ups...'",
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
        "questionNumber": 33,
        "correctAnswer": "E",
        "explanation": "Paragraph E discusses the importance of hydration and drinking water for body functions, mentioning how water regulates body temperature and transports nutrients.",
        "marks": 1,
        "acceptableAlternatives": "None - must be letter E",
        "markingGuidance": "Award 1 mark for E only. Student must identify that paragraph E contains information about water/hydration importance.",
        "textReference": "Paragraph E: 'Staying hydrated by drinking plenty of water is crucial for regulating body temperature, transporting nutrients...'"
      },
      {
        "questionNumber": 37,
        "correctAnswer": "stamina",
        "explanation": "The word 'stamina' appears in Paragraph A in the context of building physical endurance through regular exercise.",
        "marks": 1,
        "acceptableAlternatives": "None - must be exact word 'stamina' from passage",
        "commonErrors": "Students may write 'strength' or 'endurance' (synonyms not from text). Students may write 'physical stamina' (more than one word).",
        "markingGuidance": "Award 1 mark for 'stamina' only. Must be spelled correctly and be exactly one word from the passage. Do not accept synonyms like 'endurance', 'strength', or 'fitness' even if they fit the sentence meaning.",
        "textReference": "Paragraph A: 'Regular exercise builds stamina and improves cardiovascular health...'"
      }
    ],
    "partSpecificGuidance": {
      "part5_matching": {
        "focus": "Information location and paragraph content matching",
        "markingPrinciple": "Award marks only for correct paragraph letter that contains the specified information",
        "commonIssues": "Students may choose paragraphs with related but not specific information",
        "teachingPoint": "Each paragraph discusses ONE main aspect - students must match statement to the paragraph that SPECIFICALLY addresses that topic, not just mentions it briefly"
      },
      "part5_transfer": {
        "focus": "Vocabulary extraction - exact words from passage",
        "markingPrinciple": "Accept ONLY the exact word from the passage, correctly spelled. NO synonyms, NO paraphrasing.",
        "commonIssues": "Students use synonyms instead of passage words; students write multiple words; spelling errors",
        "teachingPoint": "The answer MUST be a word that appears in the passage. Students should locate the relevant section first, then extract the exact word that fits grammatically and semantically.",
        "criticalRule": "ONE WORD ONLY - if student writes more than one word or uses a word not in the passage, award 0 marks even if meaning is correct"
      }
    }
  }
}

**CRITICAL PART 5 GENERATION CHECKLIST:**
✓ Part 5 passage has EXACTLY 6 paragraphs labeled A-F
✓ Each paragraph is 60-80 words with distinct topic
✓ Questions 33-36 each match to ONE specific paragraph (A-F)
✓ Questions 37-40 answers are SINGLE WORDS that appear verbatim in the passage
✓ All 8 Part 5 questions are complete and properly structured
✓ Passage contains vocabulary suitable for word extraction
✓ Total questions = 40 (Parts 1-5: 8+10+8+6+8)

Generate ALL 40 questions following authentic SPM format. Part 5 must have complete passage with labeled paragraphs and all 8 questions properly formatted.
`;
};

const buildPaper2Prompt = (data) => {
  return `
# CRITICAL: Generate SPM English Paper 2 (Writing) Examination

Create a complete SPM English Paper 2 examination based on the Malaysian KSSM curriculum format.

## Lesson Context:
- Subject: ${data.subject || "English"}
- Topic: ${data.lesson || "English Lesson"}
- Grade: ${data.grade || "Form 5"}
- Theme: ${data.theme || "General"}
- Learning Focus: ${
    data.learningOutline?.during || "Writing skills development"
  }

## Paper Configuration:
- Paper Type: Paper 2 (Writing)
- Duration: ${data.timeAllocation || "90"} minutes
- Total Parts: 3 parts
- Total Marks: 60 marks
- Communication Format: ${data.communicationFormat || "Email"}
- Essay Types: ${data.essayTypes?.join(", ") || "Article, Report, Story"}
- Topic Categories: ${
    data.topicCategories?.join(", ") || "Health, Environment, Culture"
  }
- Complexity: ${data.promptComplexity || "Intermediate"}

## Paper Structure (MANDATORY):

**Part 1: Short Communicative Message (20 marks)**
- Format: ${data.communicationFormat || "Email"}
- Word Count: About 80 words
- Task: Respond to a given situation
- Focus: Clear communication, appropriate format, accurate information

**Part 2: Guided Writing (20 marks)**
- Format: Essay with guided points
- Word Count: 125-150 words  
- Task: Write based on given notes/points related to "${data.lesson}"
- Focus: Content development, organization, language accuracy

**Part 3: Extended Writing (20 marks)**
- Format: Choose 1 from 3 options
- Options: ${data.essayTypes?.join(", ") || "Article, Report, Story"}
- Word Count: 200-250 words
- Focus: Content, organization, language range, communicative achievement

## Output Requirements:

You MUST return a JSON object with this EXACT structure:

{
  "examContent": {
    "title": "SPM English Paper 2 (1119/2)", 
    "subtitle": "Writing",
    "duration": "${data.timeAllocation || "90"} minutes",
    "totalParts": 3,
    "totalMarks": 60,
    "instructions": [
      "Answer all questions",
      "Write your answers in the spaces provided",
      "Pay attention to word limits for each part",
      "Plan your time: Part 1 (25 min), Part 2 (30 min), Part 3 (35 min)"
    ],
    "parts": [
      {
        "partNumber": 1,
        "title": "Part 1: Short Communicative Message",
        "marks": 20,
        "wordCount": "About 80 words",
        "timeAllocation": "25 minutes",
        "instructions": "You must answer this question.",
        "scenario": "Your friend Alex has asked for advice about maintaining a healthy lifestyle as they are feeling tired and stressed lately. They want to know about exercise, diet, and sleep habits.",
        "task": "Write an ${
          data.communicationFormat || "email"
        } to Alex giving helpful advice about staying healthy",
        "requiredContent": [
          "Suggest suitable exercises for beginners",
          "Recommend healthy eating habits", 
          "Give advice about getting enough sleep",
          "Encourage Alex to start making small changes"
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
        "topic": "The importance of ${
          data.lesson || "healthy living"
        } for teenagers",
        "guidingPoints": [
          "Physical benefits of ${data.lesson || "healthy habits"}",
          "Mental and emotional advantages", 
          "Ways to encourage teenagers to adopt healthier lifestyles"
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
        "instructions": "Choose ONE of the following questions. Answer in 200-250 words in an appropriate style.",
        "options": [
          {
            "questionNumber": "3A",
            "type": "${data.essayTypes?.[0] || "Article"}",
            "topic": "Health and Wellness for Students",
            "prompt": "Your school magazine is publishing articles about student health and wellness. Write an article discussing the challenges students face in maintaining a healthy lifestyle and suggest practical solutions.",
            "notes": [
              "Common health challenges for students",
              "Impact of academic stress on health",
              "Practical tips for staying healthy while studying"
            ]
          },
          {
            "questionNumber": "3B", 
            "type": "${data.essayTypes?.[1] || "Report"}",
            "topic": "School Health Initiative Report",
            "prompt": "Your school wants to implement a new health and wellness program. Write a report for the school administration outlining the current health issues among students and recommending improvements.",
            "notes": [
              "Current health problems observed in school",
              "Benefits of a comprehensive health program",
              "Specific recommendations for implementation"
            ]
          },
          {
            "questionNumber": "3C",
            "type": "${data.essayTypes?.[2] || "Story"}",
            "topic": "A Life-Changing Health Decision",
            "prompt": "Write a story about a teenager who decides to make a major change to improve their health. Your story should show the challenges they face and how they overcome them.",
            "requirements": [
              "Include realistic challenges and obstacles",
              "Show character development and growth",
              "Create an engaging narrative with a clear message"
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
            "description": "Appropriateness of format, register, and tone for ${
              data.communicationFormat || "email"
            }"
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
        "detailedMarkingGuide": {
          "content": {
            "fullMarks": "All 4 content points addressed completely and relevantly with appropriate detail and personal touch",
            "goodMarks": "3-4 content points addressed with good development and relevant details", 
            "satisfactoryMarks": "2-3 content points addressed adequately with basic development",
            "lowMarks": "1-2 content points with limited development or missing key information"
          },
          "communicativeAchievement": {
            "fullMarks": "Perfect email format (greeting, body, closing, sign-off), consistently appropriate friendly tone, natural register throughout",
            "goodMarks": "Good email format with minor inconsistencies, generally appropriate tone with occasional lapses",
            "satisfactoryMarks": "Basic email format present, generally appropriate tone but may be too formal or informal in places",
            "lowMarks": "Poor format (missing essential email elements) or inappropriate tone affecting communication effectiveness"
          },
          "organisation": {
            "fullMarks": "Clear logical flow with smooth transitions between points, ideas well-connected and easy to follow",
            "goodMarks": "Good organisation with minor issues in transitions, generally logical flow",
            "satisfactoryMarks": "Basic organisation present, some attempt at logical sequencing",
            "lowMarks": "Poor organisation, disconnected ideas, difficult to follow"
          },
          "language": {
            "fullMarks": "Wide range of vocabulary used accurately, complex structures handled well, minimal errors that don't impede communication",
            "goodMarks": "Good vocabulary range with occasional errors, generally accurate grammar",
            "satisfactoryMarks": "Adequate vocabulary for task, basic structures mostly accurate",
            "lowMarks": "Limited vocabulary, frequent errors impeding communication"
          }
        },
        "sampleMarkingComments": [
          "Excellent response addressing all required points with natural, friendly tone and perfect email format - Full marks",
          "Good advice given but missing encouragement point and informal greeting - deduct 2 marks from content, 1 from communicative achievement",
          "Format issues: missing proper email greeting/closing, too formal tone for friend - deduct 3 marks from communicative achievement",
          "All points covered but very brief development, needs more specific advice - deduct 2 marks from content",
          "Language errors (verb tenses, prepositions) affecting clarity - deduct 2 marks from language"
        ],
        "contentPointsBreakdown": {
          "exerciseAdvice": "2 marks - Must suggest specific, suitable exercises for beginners with brief explanation",
          "dietAdvice": "2 marks - Must recommend specific healthy eating habits, not just 'eat healthy'",
          "sleepAdvice": "2 marks - Must give specific advice about sleep duration, routine, or habits",
          "encouragement": "2 marks - Must include motivational language to encourage Alex to start making changes"
        },
        "markingInstructions": [
          "Read entire response first to assess overall communication effectiveness",
          "Check systematically for each of the 4 required content points",
          "Evaluate format appropriateness - must follow email conventions for full communicative achievement marks",
          "Consider naturalness of language - should sound like genuine communication between friends",
          "Deduct marks proportionally - missing content points result in significant deductions"
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
        "detailedMarkingGuide": {
          "contentDevelopment": {
            "fullMarks": "All 3 guided points fully developed with personal opinions, relevant examples, and clear explanations showing deep understanding",
            "goodMarks": "All 3 points addressed with good development of 2-3 points, some personal opinions and examples provided",
            "satisfactoryMarks": "All 3 points mentioned but limited development, basic examples or opinions included",
            "lowMarks": "1-2 points missing or very poor development, lacks personal opinions or relevant examples"
          },
          "organisation": {
            "fullMarks": "Clear introduction stating position, well-developed body paragraphs for each point, effective conclusion summarizing key ideas",
            "goodMarks": "Good structure with minor issues in paragraph development or transitions",
            "satisfactoryMarks": "Basic essay structure present with identifiable introduction, body, and conclusion",
            "lowMarks": "Poor organisation affecting clarity, missing key structural elements"
          },
          "language": {
            "fullMarks": "Wide vocabulary range, varied sentence structures, accurate grammar throughout, sophisticated expression",
            "goodMarks": "Good vocabulary with some variety, generally accurate with minor errors",
            "satisfactoryMarks": "Adequate vocabulary for task, basic structures mostly correct",
            "lowMarks": "Limited vocabulary, frequent errors impeding understanding"
          }
        },
        "guidedPointsBreakdown": {
          "physicalBenefits": "3 marks - Must discuss specific physical health benefits with examples or explanation",
          "mentalEmotionalAdvantages": "3 marks - Must address psychological/emotional benefits, not just repeat physical benefits", 
          "encouragementWays": "3 marks - Must suggest practical, specific ways to encourage healthy lifestyle adoption"
        },
        "markingInstructions": [
          "Each guided point must be present and developed - deduct 3 marks per completely missing point",
          "Look for personal opinions and relevant examples - these demonstrate higher-order thinking",
          "Assess language range and accuracy throughout - reward variety and sophistication",
          "Consider coherence between guided points - should flow logically as unified essay",
          "Award marks for creativity within appropriate boundaries of guided writing format"
        ],
        "qualityIndicators": {
          "highQuality": "All points well-integrated with personal voice, clear stance, relevant examples from student experience or observation",
          "averageQuality": "Points addressed but development uneven, some personal input but may rely heavily on general statements",
          "lowQuality": "Points mentioned but not developed, lacks personal opinion or specific examples"
        }
      },
      "part3": {
        "marks": 20,
        "criteria": [
          {
            "aspect": "Content",
            "marks": 8,
            "description": "Creativity, relevance, and development of ideas appropriate to chosen format"
          },
          {
            "aspect": "Communicative Achievement",
            "marks": 5,
            "description": "Effectiveness in engaging reader and achieving purpose of text type"
          },
          {
            "aspect": "Organisation", 
            "marks": 4,
            "description": "Logical structure appropriate to chosen text type (article/report/story)"
          },
          {
            "aspect": "Language",
            "marks": 3,
            "description": "Vocabulary range, grammar accuracy, spelling and punctuation"
          }
        ],
        "textTypeSpecificGuides": {
          "article": {
            "contentMarking": "Engaging headline (1 mark), clear introduction hooking reader (2 marks), informative body with specific examples and solutions (4 marks), effective conclusion with call to action or summary (1 mark)",
            "achievementMarking": "Engaging reader interest through personal anecdotes or striking facts, appropriate article conventions (subheadings, quotes), clear informative purpose",
            "organisationMarking": "Logical article structure with clear paragraphs and smooth transitions, appropriate use of subheadings or formatting",
            "commonIssues": "Students often write as essay rather than article format, missing engaging elements, lack of specific examples",
            "markingTips": "Look for article-specific features: headline, engaging opening, informative tone, practical advice"
          },
          "report": {
            "contentMarking": "Clear executive summary/introduction (2 marks), detailed findings with evidence (4 marks), practical recommendations with justification (2 marks)",
            "achievementMarking": "Objective tone maintained throughout, formal register appropriate for administration, professional presentation",
            "organisationMarking": "Clear report structure with appropriate headings (Introduction, Findings, Recommendations), logical flow of information",
            "commonIssues": "Students may be too informal, lack specific recommendations, or fail to provide evidence for findings",
            "markingTips": "Assess objectivity, formality, and practical value of recommendations. Look for evidence-based conclusions."
          },
          "story": {
            "contentMarking": "Engaging opening that establishes character and situation (2 marks), clear character development showing change (2 marks), realistic challenges and obstacles (2 marks), satisfying resolution with clear message (2 marks)",
            "achievementMarking": "Reader engagement through descriptive language and realistic dialogue, appropriate narrative techniques, clear moral/message",
            "organisationMarking": "Logical story structure with clear beginning, middle, end, effective use of chronological or other narrative structure",
            "commonIssues": "Students often rush the ending, lack character development, or create unrealistic scenarios",
            "markingTips": "Evaluate character growth, realism of challenges, and clarity of the health-related message"
          }
        },
        "markingInstructions": [
          "Identify which text type student chose before beginning assessment",
          "Apply text-type specific criteria - don't mark article as essay or story as report",
          "Reward creativity and originality within appropriate format boundaries",
          "Consider target audience appropriateness for chosen text type",
          "Assess whether student achieved the communicative purpose of their chosen format"
        ],
        "sampleResponses": {
          "article": {
            "excellentFeatures": "Catchy headline 'Health Hacks for Busy Students', engaging opening with statistics, subheadings organizing content, practical tips with examples, call to action in conclusion",
            "markingExample": "Content: 7/8 (excellent examples and solutions), Achievement: 5/5 (perfect article format), Organisation: 4/4 (clear structure), Language: 3/3 (varied vocabulary)"
          },
          "report": {
            "excellentFeatures": "Professional title, clear sections (Executive Summary, Current Issues, Recommendations), objective tone, specific data, actionable recommendations with timeline",
            "markingExample": "Content: 8/8 (comprehensive findings and practical recommendations), Achievement: 4/5 (very formal and professional), Organisation: 4/4 (perfect structure), Language: 2/3 (minor errors)"
          },
          "story": {
            "excellentFeatures": "Compelling character introduction, realistic health challenges (stress, poor diet), gradual character development, believable obstacles, inspiring but realistic conclusion",
            "markingExample": "Content: 6/8 (good development but rushed ending), Achievement: 4/5 (engaging narrative), Organisation: 3/4 (good structure, abrupt transition), Language: 3/3 (excellent descriptive language)"
          }
        }
      }
    },
    "comprehensiveMarkingGuide": {
      "beforeMarking": [
        "Read the entire response first to get overall impression and identify student's ability level",
        "Identify which text type student attempted in Part 3 - this determines specific criteria to apply",
        "Check word counts for all parts - deduct marks for significantly under word limits (more than 20% under) or over limits (more than 50% over)",
        "Note overall language proficiency level to ensure consistent marking across all criteria",
        "Review the specific content requirements for each part to ensure systematic assessment"
      ],
      "duringMarking": [
        "Use positive marking approach - reward what students can do rather than penalizing what they cannot",
        "Consider communicative effectiveness over perfect accuracy - does the message come across clearly?",
        "Look for evidence of planning and organisation in structure and content development",
        "Award marks for creativity and originality within appropriate format boundaries",
        "Be consistent in applying criteria across all student responses",
        "Make brief notes about strengths and areas for improvement for feedback purposes"
      ],
      "afterMarking": [
        "Double-check addition of marks for each part and total",
        "Ensure marks awarded align with the demonstrated ability level across all parts",
        "Review any borderline cases to ensure fair and consistent application of criteria",
        "Consider whether feedback comments match the marks awarded"
      ],
      "qualityIndicators": {
        "excellent": "Natural, fluent expression with sophisticated vocabulary, complex structures used accurately, creative and engaging content, perfect format adherence",
        "good": "Generally accurate language with good vocabulary range, minor errors don't impede communication, well-developed content, appropriate format",
        "satisfactory": "Adequate expression with basic vocabulary sufficient for task, some errors but meaning generally clear, content addresses requirements",
        "needsImprovement": "Frequent errors impede communication, limited vocabulary range, content lacks development, format issues affect communication"
      },
      "commonStudentErrors": {
        "part1": "Too formal/informal tone, missing email elements, insufficient development of content points, word count issues",
        "part2": "Missing guided points, lack of personal opinion, poor essay structure, repetition of points without development",
        "part3": "Wrong text type features, inappropriate register, lack of creativity, rushing the conclusion"
      },
      "feedbackGuidelines": {
        "strengths": "Always identify specific strengths in language use, content development, or format adherence",
        "improvements": "Provide specific, actionable advice for improvement in weaker areas",
        "encouragement": "Acknowledge effort and progress while indicating areas for further development",
        "examples": "Where possible, provide brief examples of how improvements could be made"
      }
    },
    "gradingScale": {
      "A": "51-60 marks (85-100%)",
      "B": "42-50 marks (70-84%)",
      "C": "30-41 marks (50-69%)", 
      "D": "18-29 marks (30-49%)",
      "E": "12-17 marks (20-29%)",
      "G": "0-11 marks (0-19%)"
    },
    "teacherGuidance": {
      "timeManagement": "Allocate approximately 3-4 minutes per script for initial reading and marking, with additional time for borderline cases",
      "consistency": "Use sample responses and marking criteria to calibrate marking standards, especially when multiple teachers are involved",
      "documentation": "Keep records of common errors and successful approaches for future teaching reference",
      "moderation": "Regular cross-marking and discussion of borderline cases ensures fair and consistent standards"
    }
  }
}

CRITICAL: Generate authentic SPM Paper 2 content with realistic scenarios connecting to the lesson topic "${
    data.lesson
  }". Ensure all parts are complete and follow official SPM format exactly.
`;
};

const convertExamToHTML = (examContent, paperType = "paper1") => {
  if (!examContent) return null;

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      ${getEnhancedPdfStyles()}
    </head>
    <body>
    <div class="exam-content">
      <div class="exam-header">
        <h1>${examContent.title || "SPM English Examination"}</h1>
        <h2>${examContent.subtitle || "Reading and Use of English"}</h2>
        <div class="student-info">
          <p><strong>Name:</strong> ___________________ <strong>IC No.:</strong> ___________________</p>
          <p><strong>Index No.:</strong> ___________________ <strong>Class:</strong> ___________</p>
          <p><strong>Duration:</strong> ${
            examContent.duration || "90 minutes"
          } | <strong>${paperType === "paper1" ? "Questions:" : "Parts:"} ${
    examContent.totalQuestions || examContent.totalParts || 40
  }</strong> | <strong>Marks:</strong> ${examContent.totalMarks || 40}</p>
        </div>
      </div>
  `;

  if (examContent.instructions) {
    html += `<div class="instructions">
      <h3>Instructions:</h3>
      <ul>`;
    examContent.instructions.forEach((instruction) => {
      html += `<li>${instruction}</li>`;
    });
    html += `</ul></div>`;
  }

  if (examContent.parts && Array.isArray(examContent.parts)) {
    examContent.parts.forEach((part) => {
      if (!part) return;

      html += `
        <div class="exam-part">
          <h3>${part.title || `Part ${part.partNumber}`}</h3>
          <p><em>${part.instructions || ""}</em></p>`;

      if (part.passage) {
        html += `<div style="background: #f6ffed; padding: 10px; border-radius: 4px; margin: 8px 0;">
          <p>${part.passage}</p>
        </div>`;
      }

      if (part.questions && Array.isArray(part.questions)) {
        part.questions.forEach((question) => {
          if (!question) return;

          html += `<div class="question-wrapper"><div class="question">
            <p><strong>${question.questionNumber || ""}.</strong> ${
            question.question || question.text || ""
          }</p>`;

          if (question.options && Array.isArray(question.options)) {
            html += `<div class="options">`;
            question.options.forEach((option) => {
              html += `<p>${option}</p>`;
            });
            html += `</div>`;
          }
          html += `</div></div>`;
        });
      }

      html += `</div>`;
    });
  }

  html += `</div></body></html>`;
  return html;
};

const convertPaper1Parts = (parts) => {
  if (!Array.isArray(parts)) {
    console.warn("⚠️ Parts is not an array:", parts);
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
    console.warn("⚠️ Parts is not an array:", parts);
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
