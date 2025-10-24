const {
  convertActivityToHTML,
  convertAssessmentToHTML,
  convertRubricToHTML,
  convertAnswerKeyToHTML,
  convertExamToHTML,
} = require("./htmlTemplates");

/**
 * Structure generated content based on activity type
 * Converts JSON content to HTML and organizes it properly
 */
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
    case "activityInClass":
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

module.exports = { structureGeneratedContent };
