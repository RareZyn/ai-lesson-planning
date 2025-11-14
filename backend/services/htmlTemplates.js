// backend/services/htmlTemplates.js
// Centralized HTML template generation for assessments

/**
 * Generate enhanced PDF styles for better rendering
 */
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
      @page {
        size: A4;
        margin: 0;
      }

      body {
        padding: 0;
        margin: 0;
        width: 210mm;
      }

      .question, .question-wrapper, .answer-item, .exam-part {
        page-break-inside: avoid !important;
      }

      h1, h2, h3, h4 {
        page-break-after: avoid !important;
      }

      /* CRITICAL: Prevent answer sheet from splitting across pages */
      .spm-answer-sheet {
        page-break-before: always !important;
        page-break-inside: avoid !important;
        page-break-after: auto !important;
        width: 210mm !important;
        min-height: 297mm !important;
        margin: 0 auto !important;
        display: block !important;
      }
    }
  </style>
`;

/**
 * Generate SPM Paper 1 Answer Sheet HTML
 * This will always be appended to Paper 1 exports
 * OPTIMIZED FOR OCR DETECTION with proper spacing, bubble size, and alignment marks
 * Questions 1-32: Multiple choice bubbles (A-H)
 * Questions 33-40: Short subjective answer lines
 */
const generateSpmAnswerSheetHTML = () => {
  // Helper function to generate a single question row with bubbles (for MCQ)
  const generateQuestionRow = (qNum) => {
    const bubbles = ["A", "B", "C", "D", "E", "F", "G", "H"]
      .map(
        (letter) => `
          <div style="display: inline-flex; flex-direction: column; align-items: center; justify-content: flex-end; margin: 0 1.5mm; min-height: 7mm;">
            <span style="font-size: 6.5pt; font-weight: normal; margin-bottom: 0.5mm; display: block;">${letter}</span>
            <div style="width: 3.5mm; height: 3.5mm; border: 0.3mm solid #000; border-radius: 50%; background-color: #fff; flex-shrink: 0;"></div>
          </div>
        `
      )
      .join("");

    return `
      <div style="display: flex; align-items: flex-end; margin-bottom: 2mm; page-break-inside: avoid;">
        <div style="width: 6mm; text-align: right; font-weight: bold; font-size: 8.5pt; margin-right: 1.5mm; padding-bottom: 0.8mm;">
          ${qNum}.
        </div>
        <div style="display: flex; flex-wrap: nowrap; align-items: flex-end;">
          ${bubbles}
        </div>
      </div>
    `;
  };

  // Helper function to generate subjective answer line (for short answers)
  const generateSubjectiveRow = (qNum) => {
    return `
      <div style="display: flex; align-items: center; margin-bottom: 2.5mm; page-break-inside: avoid;">
        <div style="width: 6mm; text-align: right; font-weight: bold; font-size: 8.5pt; margin-right: 1.5mm;">
          ${qNum}.
        </div>
        <div style="flex: 1; border-bottom: 1.5px solid #000; min-height: 4.5mm;"></div>
      </div>
    `;
  };

  // Column 1: Questions 1-20 (all MCQ)
  const column1Questions = Array.from({ length: 20 }, (_, i) =>
    generateQuestionRow(i + 1)
  ).join("");

  // Column 2: Questions 21-32 (MCQ) + Questions 33-40 (Subjective)
  const column2McqQuestions = Array.from({ length: 12 }, (_, i) =>
    generateQuestionRow(i + 21)
  ).join("");

  const column2SubjectiveQuestions = Array.from({ length: 8 }, (_, i) =>
    generateSubjectiveRow(i + 33)
  ).join("");

  return `
    <div class="spm-answer-sheet" style="page-break-before: always; width: 210mm; height: 297mm; margin: 0 auto; padding: 8mm; background: white; font-family: Arial, sans-serif; box-sizing: border-box; position: relative; overflow: hidden;">

      <!-- Registration/Alignment Marks for OCR -->
      <div style="position: absolute; top: 4mm; left: 4mm; width: 2.5mm; height: 2.5mm; background: #000;"></div>
      <div style="position: absolute; top: 4mm; right: 4mm; width: 2.5mm; height: 2.5mm; background: #000;"></div>
      <div style="position: absolute; bottom: 4mm; left: 4mm; width: 2.5mm; height: 2.5mm; background: #000;"></div>
      <div style="position: absolute; bottom: 4mm; right: 4mm; width: 2.5mm; height: 2.5mm; background: #000;"></div>

      <!-- Header Section -->
      <div style="border: 1.5px solid #000; padding: 2.5mm; margin-bottom: 2.5mm;">
        <div style="text-align: center; font-size: 13pt; font-weight: bold; margin-bottom: 1.5mm; letter-spacing: 0.5px;">
          SPM ENGLISH PAPER 1
        </div>
        <div style="text-align: center; font-size: 9pt; margin-bottom: 2.5mm;">
          READING AND USE OF ENGLISH - ANSWER SHEET
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 1.5mm;">
          <div style="display: flex; align-items: center;">
            <span style="font-size: 9pt; font-weight: bold; margin-right: 1.5mm;">NAME:</span>
            <span style="border-bottom: 1px solid #000; width: 65mm; display: inline-block;"></span>
          </div>
          <div style="display: flex; align-items: center;">
            <span style="font-size: 9pt; font-weight: bold; margin-right: 1.5mm;">CLASS:</span>
            <span style="border-bottom: 1px solid #000; width: 28mm; display: inline-block;"></span>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between;">
          <div style="display: flex; align-items: center;">
            <span style="font-size: 9pt; font-weight: bold; margin-right: 1.5mm;">INDEX NO:</span>
            <span style="border-bottom: 1px solid #000; width: 45mm; display: inline-block;"></span>
          </div>
          <div style="display: flex; align-items: center;">
            <span style="font-size: 9pt; font-weight: bold; margin-right: 1.5mm;">DATE:</span>
            <span style="border-bottom: 1px solid #000; width: 38mm; display: inline-block;"></span>
          </div>
        </div>
      </div>

      <!-- Instructions -->
      <div style="background: #f0f0f0; border: 1px solid #666; padding: 1.5mm; margin-bottom: 2.5mm; font-size: 7.5pt; line-height: 1.3;">
        <strong>INSTRUCTIONS:</strong> Use a dark pencil (2B) to fill in the circle. Mark ONE answer per question. Erase to change.
      </div>

      <!-- Two-Column Answer Grid -->
      <div style="display: flex; gap: 4mm; justify-content: space-between;">

        <!-- Column 1: Questions 1-20 -->
        <div style="flex: 1; border: 1.5px solid #000; padding: 2.5mm; background: #fafafa;">
          <div style="text-align: center; font-weight: bold; font-size: 8.5pt; margin-bottom: 1.5mm; padding-bottom: 1mm; border-bottom: 1px solid #666;">
            QUESTIONS 1 - 20
          </div>
          ${column1Questions}
        </div>

        <!-- Column 2: Questions 21-40 -->
        <div style="flex: 1; border: 1.5px solid #000; padding: 2.5mm; background: #fafafa;">
          <div style="text-align: center; font-weight: bold; font-size: 8.5pt; margin-bottom: 1.5mm; padding-bottom: 1mm; border-bottom: 1px solid #666;">
            QUESTIONS 21 - 40
          </div>

          <!-- MCQ Questions 21-32 -->
          ${column2McqQuestions}

          <!-- Subjective Section Header -->
          <div style="margin-top: 2mm; margin-bottom: 1.5mm; padding: 1.5mm; background: #e8e8e8; border-radius: 1mm; text-align: center;">
            <strong style="font-size: 7.5pt;">Part 5: Write your answers (Questions 33-40)</strong>
          </div>

          <!-- Subjective Questions 33-40 -->
          ${column2SubjectiveQuestions}
        </div>

      </div>

      <!-- Footer with timing marks -->
      <div style="margin-top: 2mm; text-align: center; font-size: 6.5pt; color: #666; border-top: 1px solid #ccc; padding-top: 1mm;">
        DO NOT WRITE BELOW THIS LINE - FOR EXAMINER USE ONLY
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 1mm; padding: 1.5mm; border: 1px solid #ccc; font-size: 7.5pt;">
        <div>Score: ____ / 40</div>
        <div>Grade: ____</div>
        <div>Examiner: __________</div>
      </div>

    </div>
  `;
};

/**
 * Convert Activity Content to HTML
 */
const convertActivityToHTML = (activityContent, activityType) => {
  if (!activityContent) return null;

  let html = `
    <div class="activity-content" style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
      <div class="activity-header" style="border-bottom: 2px solid #1890ff; padding-bottom: 15px; margin-bottom: 20px;">
        <h1 style="color: #1890ff; margin-bottom: 10px;">${activityContent.title || "Activity"
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
          <h3 style="color: #fa8c16;">Essay</h3>
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
    case "activityInClass":
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
          <p><strong>Pages:</strong> ${activityContent.textbookReference.pages
          }</p>
          <p><strong>Chapter:</strong> ${activityContent.textbookReference.chapter
          }</p>
          ${activityContent.textbookReference.section
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
            <p><strong>Question ${index + 1} (${question.type}):</strong> ${question.question
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

/**
 * Convert Assessment Content to HTML
 */
const convertAssessmentToHTML = (assessmentContent) => {
  if (!assessmentContent) return null;

  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">${getEnhancedPdfStyles()}</head><body>
    <div class="assessment-content">
      <div class="assessment-header">
        <h1>${assessmentContent.title || "Assessment"}</h1>
        <div class="student-info">
          <p><strong>Name:</strong> _______________ <strong>Class:</strong> _________ <strong>Date:</strong> _________</p>
        </div>
        <div class="assessment-info">
          <p><strong>Time:</strong> ${assessmentContent.timeAllocation || "60 minutes"
    } | <strong>Questions:</strong> ${assessmentContent.totalQuestions || "N/A"
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
        <h4>Question ${question.questionNumber} (${question.points} ${question.points === 1 ? "point" : "points"
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

/**
 * Convert SPM Paper 2 Rubric Content to Comprehensive HTML
 */
const convertSpmPaper2RubricToHTML = (answerKeyContent) => {
  if (!answerKeyContent || !answerKeyContent.assessmentCriteria) {
    return convertRubricToHTML(answerKeyContent); // Fallback to regular rubric
  }

  let html = `
    <div class="spm-paper2-rubric" style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.5;">
      <h1 style="color: #1890ff; margin-bottom: 10px; border-bottom: 3px solid #1890ff; padding-bottom: 10px;">
        ${answerKeyContent.title || "MARKING SCHEME - SPM English Paper 2"}
      </h1>
      <div style="background: #e6f7ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 5px 0;"><strong>Total Marks:</strong> ${answerKeyContent.totalMarks || 60}</p>
        <p style="margin: 5px 0;"><strong>Paper Type:</strong> Writing (1119/2)</p>
        <p style="margin: 5px 0; font-style: italic;">This comprehensive marking guide provides detailed criteria for evaluating each part of the examination.</p>
      </div>
  `;

  const criteria = answerKeyContent.assessmentCriteria;

  // Part 1: Short Communicative Message
  if (criteria.part1) {
    html += `
      <div class="part-marking" style="margin-bottom: 30px; border: 2px solid #52c41a; border-radius: 8px; padding: 20px;">
        <h2 style="color: #52c41a; margin-bottom: 15px;">📧 Part 1: Short Communicative Message (${criteria.part1.marks} marks)</h2>

        <div style="background: #f6ffed; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
          <h3 style="color: #389e0d; margin-bottom: 10px;">Assessment Criteria:</h3>
          <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #52c41a; color: white;">
                <th>Aspect</th>
                <th>Marks</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>`;

    criteria.part1.criteria.forEach((criterion, index) => {
      const bgColor = index % 2 === 0 ? "#ffffff" : "#f6ffed";
      html += `
              <tr style="background-color: ${bgColor};">
                <td style="font-weight: bold;">${criterion.aspect}</td>
                <td style="text-align: center; font-weight: bold;">${criterion.marks}</td>
                <td>${criterion.description}</td>
              </tr>`;
    });

    html += `
            </tbody>
          </table>
        </div>

        <div style="background: #fff7e6; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
          <h3 style="color: #d48806; margin-bottom: 10px;">📋 Detailed Marking Guide:</h3>`;

    if (criteria.part1.detailedMarkingGuide) {
      const guide = criteria.part1.detailedMarkingGuide;

      // Content
      if (guide.content) {
        html += `
          <div style="margin-bottom: 15px; padding: 12px; background: white; border-left: 4px solid #1890ff; border-radius: 4px;">
            <h4 style="color: #1890ff; margin-bottom: 8px;">Content (8 marks):</h4>
            <ul style="margin: 5px 0; padding-left: 20px;">
              <li><strong>Full Marks (8/8):</strong> ${guide.content.fullMarks}</li>
              <li><strong>Good (6-7/8):</strong> ${guide.content.goodMarks}</li>
              <li><strong>Satisfactory (4-5/8):</strong> ${guide.content.satisfactoryMarks}</li>
              <li><strong>Low (0-3/8):</strong> ${guide.content.lowMarks}</li>
            </ul>
          </div>`;
      }

      // Communicative Achievement
      if (guide.communicativeAchievement) {
        html += `
          <div style="margin-bottom: 15px; padding: 12px; background: white; border-left: 4px solid #52c41a; border-radius: 4px;">
            <h4 style="color: #52c41a; margin-bottom: 8px;">Communicative Achievement (6 marks):</h4>
            <ul style="margin: 5px 0; padding-left: 20px;">
              <li><strong>Full Marks (6/6):</strong> ${guide.communicativeAchievement.fullMarks}</li>
              <li><strong>Good (4-5/6):</strong> ${guide.communicativeAchievement.goodMarks}</li>
              <li><strong>Satisfactory (2-3/6):</strong> ${guide.communicativeAchievement.satisfactoryMarks}</li>
              <li><strong>Low (0-1/6):</strong> ${guide.communicativeAchievement.lowMarks}</li>
            </ul>
          </div>`;
      }

      // Organisation
      if (guide.organisation) {
        html += `
          <div style="margin-bottom: 15px; padding: 12px; background: white; border-left: 4px solid #fa8c16; border-radius: 4px;">
            <h4 style="color: #fa8c16; margin-bottom: 8px;">Organisation (3 marks):</h4>
            <ul style="margin: 5px 0; padding-left: 20px;">
              <li><strong>Full Marks (3/3):</strong> ${guide.organisation.fullMarks}</li>
              <li><strong>Good (2/3):</strong> ${guide.organisation.goodMarks}</li>
              <li><strong>Satisfactory (1/3):</strong> ${guide.organisation.satisfactoryMarks}</li>
              <li><strong>Low (0/3):</strong> ${guide.organisation.lowMarks}</li>
            </ul>
          </div>`;
      }

      // Language
      if (guide.language) {
        html += `
          <div style="margin-bottom: 15px; padding: 12px; background: white; border-left: 4px solid #722ed1; border-radius: 4px;">
            <h4 style="color: #722ed1; margin-bottom: 8px;">Language (3 marks):</h4>
            <ul style="margin: 5px 0; padding-left: 20px;">
              <li><strong>Full Marks (3/3):</strong> ${guide.language.fullMarks}</li>
              <li><strong>Good (2/3):</strong> ${guide.language.goodMarks}</li>
              <li><strong>Satisfactory (1/3):</strong> ${guide.language.satisfactoryMarks}</li>
              <li><strong>Low (0/3):</strong> ${guide.language.lowMarks}</li>
            </ul>
          </div>`;
      }
    }

    // Content Points Breakdown
    if (criteria.part1.contentPointsBreakdown) {
      html += `
          <div style="background: #fff1f0; padding: 12px; border-left: 4px solid #cf1322; border-radius: 4px; margin-top: 15px;">
            <h4 style="color: #cf1322; margin-bottom: 8px;">✓ Required Content Points:</h4>
            <ul style="margin: 5px 0; padding-left: 20px;">`;

      Object.entries(criteria.part1.contentPointsBreakdown).forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').trim();
        html += `<li><strong>${label.charAt(0).toUpperCase() + label.slice(1)}:</strong> ${value}</li>`;
      });

      html += `</ul></div>`;
    }

    // Marking Instructions
    if (criteria.part1.markingInstructions) {
      html += `
          <div style="background: #e6fffb; padding: 12px; border-radius: 4px; margin-top: 15px;">
            <h4 style="color: #13c2c2; margin-bottom: 8px;">🎯 Marking Instructions:</h4>
            <ol style="margin: 5px 0; padding-left: 25px;">`;

      criteria.part1.markingInstructions.forEach(instruction => {
        html += `<li style="margin-bottom: 5px;">${instruction}</li>`;
      });

      html += `</ol></div>`;
    }

    // Sample Marking Comments
    if (criteria.part1.sampleMarkingComments) {
      html += `
          <div style="background: #f9f0ff; padding: 12px; border-radius: 4px; margin-top: 15px;">
            <h4 style="color: #722ed1; margin-bottom: 8px;">💬 Sample Marking Comments:</h4>
            <ul style="margin: 5px 0; padding-left: 20px; font-size: 0.95em;">`;

      criteria.part1.sampleMarkingComments.forEach(comment => {
        html += `<li style="margin-bottom: 5px; font-style: italic;">${comment}</li>`;
      });

      html += `</ul></div>`;
    }

    html += `</div></div>`;
  }

  // Part 2: Guided Writing
  if (criteria.part2) {
    html += `
      <div class="part-marking" style="margin-bottom: 30px; border: 2px solid #1890ff; border-radius: 8px; padding: 20px;">
        <h2 style="color: #1890ff; margin-bottom: 15px;">✍️ Part 2: Guided Writing (${criteria.part2.marks} marks)</h2>

        <div style="background: #e6f7ff; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
          <h3 style="color: #096dd9; margin-bottom: 10px;">Assessment Criteria:</h3>
          <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #1890ff; color: white;">
                <th>Aspect</th>
                <th>Marks</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>`;

    criteria.part2.criteria.forEach((criterion, index) => {
      const bgColor = index % 2 === 0 ? "#ffffff" : "#e6f7ff";
      html += `
              <tr style="background-color: ${bgColor};">
                <td style="font-weight: bold;">${criterion.aspect}</td>
                <td style="text-align: center; font-weight: bold;">${criterion.marks}</td>
                <td>${criterion.description}</td>
              </tr>`;
    });

    html += `
            </tbody>
          </table>
        </div>

        <div style="background: #fff7e6; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
          <h3 style="color: #d48806; margin-bottom: 10px;">📋 Detailed Marking Guide:</h3>`;

    if (criteria.part2.detailedMarkingGuide) {
      const guide = criteria.part2.detailedMarkingGuide;

      // Content Development
      if (guide.contentDevelopment) {
        html += `
          <div style="margin-bottom: 15px; padding: 12px; background: white; border-left: 4px solid #1890ff; border-radius: 4px;">
            <h4 style="color: #1890ff; margin-bottom: 8px;">Content Development (9 marks):</h4>
            <ul style="margin: 5px 0; padding-left: 20px;">
              <li><strong>Full Marks (8-9/9):</strong> ${guide.contentDevelopment.fullMarks}</li>
              <li><strong>Good (6-7/9):</strong> ${guide.contentDevelopment.goodMarks}</li>
              <li><strong>Satisfactory (4-5/9):</strong> ${guide.contentDevelopment.satisfactoryMarks}</li>
              <li><strong>Low (0-3/9):</strong> ${guide.contentDevelopment.lowMarks}</li>
            </ul>
          </div>`;
      }

      // Organisation
      if (guide.organisation) {
        html += `
          <div style="margin-bottom: 15px; padding: 12px; background: white; border-left: 4px solid #52c41a; border-radius: 4px;">
            <h4 style="color: #52c41a; margin-bottom: 8px;">Organisation (5 marks):</h4>
            <ul style="margin: 5px 0; padding-left: 20px;">
              <li><strong>Full Marks (5/5):</strong> ${guide.organisation.fullMarks}</li>
              <li><strong>Good (3-4/5):</strong> ${guide.organisation.goodMarks}</li>
              <li><strong>Satisfactory (2/5):</strong> ${guide.organisation.satisfactoryMarks}</li>
              <li><strong>Low (0-1/5):</strong> ${guide.organisation.lowMarks}</li>
            </ul>
          </div>`;
      }

      // Language
      if (guide.language) {
        html += `
          <div style="margin-bottom: 15px; padding: 12px; background: white; border-left: 4px solid #722ed1; border-radius: 4px;">
            <h4 style="color: #722ed1; margin-bottom: 8px;">Language (6 marks):</h4>
            <ul style="margin: 5px 0; padding-left: 20px;">
              <li><strong>Full Marks (6/6):</strong> ${guide.language.fullMarks}</li>
              <li><strong>Good (4-5/6):</strong> ${guide.language.goodMarks}</li>
              <li><strong>Satisfactory (2-3/6):</strong> ${guide.language.satisfactoryMarks}</li>
              <li><strong>Low (0-1/6):</strong> ${guide.language.lowMarks}</li>
            </ul>
          </div>`;
      }
    }

    // Guided Points Breakdown
    if (criteria.part2.guidedPointsBreakdown) {
      html += `
          <div style="background: #fff1f0; padding: 12px; border-left: 4px solid #cf1322; border-radius: 4px; margin-top: 15px;">
            <h4 style="color: #cf1322; margin-bottom: 8px;">✓ Guided Points Assessment:</h4>
            <ul style="margin: 5px 0; padding-left: 20px;">`;

      Object.entries(criteria.part2.guidedPointsBreakdown).forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').trim();
        html += `<li><strong>${label.charAt(0).toUpperCase() + label.slice(1)}:</strong> ${value}</li>`;
      });

      html += `</ul></div>`;
    }

    // Marking Instructions
    if (criteria.part2.markingInstructions) {
      html += `
          <div style="background: #e6fffb; padding: 12px; border-radius: 4px; margin-top: 15px;">
            <h4 style="color: #13c2c2; margin-bottom: 8px;">🎯 Marking Instructions:</h4>
            <ol style="margin: 5px 0; padding-left: 25px;">`;

      criteria.part2.markingInstructions.forEach(instruction => {
        html += `<li style="margin-bottom: 5px;">${instruction}</li>`;
      });

      html += `</ol></div>`;
    }

    // Quality Indicators
    if (criteria.part2.qualityIndicators) {
      html += `
          <div style="background: #f9f0ff; padding: 12px; border-radius: 4px; margin-top: 15px;">
            <h4 style="color: #722ed1; margin-bottom: 8px;">🎨 Quality Indicators:</h4>
            <ul style="margin: 5px 0; padding-left: 20px;">
              <li><strong>High Quality:</strong> ${criteria.part2.qualityIndicators.highQuality}</li>
              <li><strong>Average Quality:</strong> ${criteria.part2.qualityIndicators.averageQuality}</li>
              <li><strong>Low Quality:</strong> ${criteria.part2.qualityIndicators.lowQuality}</li>
            </ul>
          </div>`;
    }

    html += `</div></div>`;
  }

  // Part 3: Extended Writing
  if (criteria.part3) {
    html += `
      <div class="part-marking" style="margin-bottom: 30px; border: 2px solid #fa8c16; border-radius: 8px; padding: 20px;">
        <h2 style="color: #fa8c16; margin-bottom: 15px;">📝 Part 3: Extended Writing (${criteria.part3.marks} marks)</h2>

        <div style="background: #fff7e6; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
          <h3 style="color: #d48806; margin-bottom: 10px;">Assessment Criteria:</h3>
          <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #fa8c16; color: white;">
                <th>Aspect</th>
                <th>Marks</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>`;

    criteria.part3.criteria.forEach((criterion, index) => {
      const bgColor = index % 2 === 0 ? "#ffffff" : "#fff7e6";
      html += `
              <tr style="background-color: ${bgColor};">
                <td style="font-weight: bold;">${criterion.aspect}</td>
                <td style="text-align: center; font-weight: bold;">${criterion.marks}</td>
                <td>${criterion.description}</td>
              </tr>`;
    });

    html += `
            </tbody>
          </table>
        </div>`;

    // Text Type Specific Guides
    if (criteria.part3.textTypeSpecificGuides) {
      const guides = criteria.part3.textTypeSpecificGuides;

      html += `<div style="background: #f6ffed; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
          <h3 style="color: #52c41a; margin-bottom: 10px;">📄 Text Type Specific Marking Guides:</h3>`;

      // Article
      if (guides.article) {
        html += `
          <div style="margin-bottom: 20px; padding: 15px; background: white; border: 2px solid #1890ff; border-radius: 5px;">
            <h4 style="color: #1890ff; margin-bottom: 10px;">📰 Article:</h4>
            <p><strong>Content Marking:</strong> ${guides.article.contentMarking}</p>
            <p><strong>Achievement Marking:</strong> ${guides.article.achievementMarking}</p>
            <p><strong>Organisation Marking:</strong> ${guides.article.organisationMarking}</p>
            <p style="color: #cf1322;"><strong>Common Issues:</strong> ${guides.article.commonIssues}</p>
            <p style="color: #389e0d;"><strong>Marking Tips:</strong> ${guides.article.markingTips}</p>
          </div>`;
      }

      // Report
      if (guides.report) {
        html += `
          <div style="margin-bottom: 20px; padding: 15px; background: white; border: 2px solid #52c41a; border-radius: 5px;">
            <h4 style="color: #52c41a; margin-bottom: 10px;">📊 Report:</h4>
            <p><strong>Content Marking:</strong> ${guides.report.contentMarking}</p>
            <p><strong>Achievement Marking:</strong> ${guides.report.achievementMarking}</p>
            <p><strong>Organisation Marking:</strong> ${guides.report.organisationMarking}</p>
            <p style="color: #cf1322;"><strong>Common Issues:</strong> ${guides.report.commonIssues}</p>
            <p style="color: #389e0d;"><strong>Marking Tips:</strong> ${guides.report.markingTips}</p>
          </div>`;
      }

      // Story
      if (guides.story) {
        html += `
          <div style="margin-bottom: 20px; padding: 15px; background: white; border: 2px solid #722ed1; border-radius: 5px;">
            <h4 style="color: #722ed1; margin-bottom: 10px;">📚 Story:</h4>
            <p><strong>Content Marking:</strong> ${guides.story.contentMarking}</p>
            <p><strong>Achievement Marking:</strong> ${guides.story.achievementMarking}</p>
            <p><strong>Organisation Marking:</strong> ${guides.story.organisationMarking}</p>
            <p style="color: #cf1322;"><strong>Common Issues:</strong> ${guides.story.commonIssues}</p>
            <p style="color: #389e0d;"><strong>Marking Tips:</strong> ${guides.story.markingTips}</p>
          </div>`;
      }

      html += `</div>`;
    }

    // Marking Instructions
    if (criteria.part3.markingInstructions) {
      html += `
          <div style="background: #e6fffb; padding: 12px; border-radius: 4px; margin-top: 15px;">
            <h4 style="color: #13c2c2; margin-bottom: 8px;">🎯 Marking Instructions:</h4>
            <ol style="margin: 5px 0; padding-left: 25px;">`;

      criteria.part3.markingInstructions.forEach(instruction => {
        html += `<li style="margin-bottom: 5px;">${instruction}</li>`;
      });

      html += `</ol></div>`;
    }

    // Sample Responses
    if (criteria.part3.sampleResponses) {
      html += `
          <div style="background: #fff0f6; padding: 12px; border-radius: 4px; margin-top: 15px;">
            <h4 style="color: #eb2f96; margin-bottom: 8px;">📋 Sample Response Features:</h4>`;

      const samples = criteria.part3.sampleResponses;

      if (samples.article) {
        html += `
            <div style="margin-bottom: 10px; padding: 10px; background: white; border-left: 3px solid #1890ff;">
              <p><strong>Excellent Article Features:</strong> ${samples.article.excellentFeatures}</p>
              <p style="font-size: 0.9em; color: #595959;"><em>Example Marking: ${samples.article.markingExample}</em></p>
            </div>`;
      }

      if (samples.report) {
        html += `
            <div style="margin-bottom: 10px; padding: 10px; background: white; border-left: 3px solid #52c41a;">
              <p><strong>Excellent Report Features:</strong> ${samples.report.excellentFeatures}</p>
              <p style="font-size: 0.9em; color: #595959;"><em>Example Marking: ${samples.report.markingExample}</em></p>
            </div>`;
      }

      if (samples.story) {
        html += `
            <div style="margin-bottom: 10px; padding: 10px; background: white; border-left: 3px solid #722ed1;">
              <p><strong>Excellent Story Features:</strong> ${samples.story.excellentFeatures}</p>
              <p style="font-size: 0.9em; color: #595959;"><em>Example Marking: ${samples.story.markingExample}</em></p>
            </div>`;
      }

      html += `</div>`;
    }

    html += `</div></div>`;
  }

  // Comprehensive Marking Guide
  if (answerKeyContent.comprehensiveMarkingGuide) {
    const compGuide = answerKeyContent.comprehensiveMarkingGuide;

    html += `
      <div class="comprehensive-guide" style="margin-top: 30px; border: 3px solid #722ed1; border-radius: 8px; padding: 20px; background: #f9f0ff;">
        <h2 style="color: #722ed1; margin-bottom: 15px;">📚 Comprehensive Marking Guide</h2>`;

    // Before Marking
    if (compGuide.beforeMarking) {
      html += `
        <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
          <h3 style="color: #1890ff; margin-bottom: 10px;">📝 Before Marking:</h3>
          <ol style="margin: 5px 0; padding-left: 25px;">`;
      compGuide.beforeMarking.forEach(step => {
        html += `<li style="margin-bottom: 5px;">${step}</li>`;
      });
      html += `</ol></div>`;
    }

    // During Marking
    if (compGuide.duringMarking) {
      html += `
        <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
          <h3 style="color: #52c41a; margin-bottom: 10px;">✅ During Marking:</h3>
          <ol style="margin: 5px 0; padding-left: 25px;">`;
      compGuide.duringMarking.forEach(step => {
        html += `<li style="margin-bottom: 5px;">${step}</li>`;
      });
      html += `</ol></div>`;
    }

    // After Marking
    if (compGuide.afterMarking) {
      html += `
        <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
          <h3 style="color: #fa8c16; margin-bottom: 10px;">🎯 After Marking:</h3>
          <ol style="margin: 5px 0; padding-left: 25px;">`;
      compGuide.afterMarking.forEach(step => {
        html += `<li style="margin-bottom: 5px;">${step}</li>`;
      });
      html += `</ol></div>`;
    }

    // Quality Indicators
    if (compGuide.qualityIndicators) {
      html += `
        <div style="background: #e6f7ff; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
          <h3 style="color: #1890ff; margin-bottom: 10px;">🎨 Quality Indicators:</h3>
          <ul style="margin: 5px 0; padding-left: 20px;">
            <li><strong>Excellent:</strong> ${compGuide.qualityIndicators.excellent}</li>
            <li><strong>Good:</strong> ${compGuide.qualityIndicators.good}</li>
            <li><strong>Satisfactory:</strong> ${compGuide.qualityIndicators.satisfactory}</li>
            <li><strong>Needs Improvement:</strong> ${compGuide.qualityIndicators.needsImprovement}</li>
          </ul>
        </div>`;
    }

    // Common Student Errors
    if (compGuide.commonStudentErrors) {
      html += `
        <div style="background: #fff1f0; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
          <h3 style="color: #cf1322; margin-bottom: 10px;">⚠️ Common Student Errors:</h3>
          <ul style="margin: 5px 0; padding-left: 20px;">`;
      Object.entries(compGuide.commonStudentErrors).forEach(([part, errors]) => {
        html += `<li><strong>${part.toUpperCase()}:</strong> ${errors}</li>`;
      });
      html += `</ul></div>`;
    }

    // Feedback Guidelines
    if (compGuide.feedbackGuidelines) {
      html += `
        <div style="background: #f6ffed; padding: 15px; border-radius: 5px;">
          <h3 style="color: #52c41a; margin-bottom: 10px;">💬 Feedback Guidelines:</h3>
          <ul style="margin: 5px 0; padding-left: 20px;">`;
      Object.entries(compGuide.feedbackGuidelines).forEach(([type, guideline]) => {
        html += `<li><strong>${type.charAt(0).toUpperCase() + type.slice(1)}:</strong> ${guideline}</li>`;
      });
      html += `</ul></div>`;
    }

    html += `</div>`;
  }

  // Grading Scale
  if (answerKeyContent.gradingScale) {
    html += `
      <div class="grading-scale" style="margin-top: 20px; padding: 20px; background: #e6f7ff; border-radius: 8px; border: 2px solid #1890ff;">
        <h2 style="color: #1890ff; margin-bottom: 15px;">📊 Final Grading Scale</h2>
        <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #1890ff; color: white;">
              <th>Grade</th>
              <th>Marks</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>`;

    Object.entries(answerKeyContent.gradingScale).forEach(([grade, range], index) => {
      const bgColor = index % 2 === 0 ? "#ffffff" : "#e6f7ff";
      html += `
            <tr style="background-color: ${bgColor};">
              <td style="text-align: center; font-weight: bold; font-size: 1.1em;">${grade}</td>
              <td style="text-align: center;">${range}</td>
              <td style="text-align: center;">${range}</td>
            </tr>`;
    });

    html += `
          </tbody>
        </table>
      </div>`;
  }

  // Teacher Guidance
  if (answerKeyContent.teacherGuidance) {
    html += `
      <div class="teacher-guidance" style="margin-top: 20px; padding: 20px; background: #fffbe6; border-radius: 8px; border: 2px solid #faad14;">
        <h2 style="color: #d48806; margin-bottom: 15px;">👨‍🏫 Teacher Guidance</h2>
        <ul style="margin: 5px 0; padding-left: 20px;">`;

    Object.entries(answerKeyContent.teacherGuidance).forEach(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').trim();
      html += `<li style="margin-bottom: 10px;"><strong>${label.charAt(0).toUpperCase() + label.slice(1)}:</strong> ${value}</li>`;
    });

    html += `</ul></div>`;
  }

  html += `</div>`;
  return html;
};

/**
 * Convert Rubric Content to HTML
 */
const convertRubricToHTML = (rubricContent) => {
  if (!rubricContent) return null;

  // Check if this is SPM Paper 2 rubric
  if (rubricContent.assessmentCriteria && rubricContent.title &&
      rubricContent.title.includes("Paper 2")) {
    return convertSpmPaper2RubricToHTML(rubricContent);
  }

  let html = `
    <div class="rubric-content" style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.5;">
      <h1 style="color: #52c41a; margin-bottom: 10px;">${rubricContent.title || "Assessment Rubric"
    }</h1>
      ${rubricContent.description
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
        <p><strong>Total Points:</strong> ${rubricContent.totalPoints || "N/A"
      }</p>`;

    if (rubricContent.gradingScale) {
      html += `<h4 style="margin-top: 15px; color: #1890ff;">Grading Scale:</h4><ul style="margin: 0; padding-left: 20px;">`;
      Object.entries(rubricContent.gradingScale).forEach(([level, range]) => {
        html += `<li><strong>${level.charAt(0).toUpperCase() + level.slice(1)
          }:</strong> ${range}</li>`;
      });
      html += `</ul>`;
    }

    html += `</div>`;
  }

  html += `</div>`;
  return html;
};

/**
 * Convert Answer Key Content to HTML
 */
const convertAnswerKeyToHTML = (answerKeyContent) => {
  if (!answerKeyContent) return null;

  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">${getEnhancedPdfStyles()}</head><body>
    <div class="answer-key-content">
      <h1>${answerKeyContent.title || "Answer Key"}</h1>
      <div class="answer-key-info">
        <p><strong>Questions:</strong> ${answerKeyContent.totalQuestions || "N/A"
    } | <strong>Points:</strong> ${answerKeyContent.totalPoints || answerKeyContent.totalMarks || "N/A"
    }</p>
      </div>`;

  if (answerKeyContent.answers && answerKeyContent.answers.length > 0) {
    html += `<div class="answers">`;
    answerKeyContent.answers.forEach((answer) => {
      const points = answer.points || answer.marks || 1;

      html += `<div class="answer-item">
        <h4>Question ${answer.questionNumber} (${points} ${points === 1 ? "point" : "points"
        })</h4>
        <div style="background: #e6f7ff; border-left: 3px solid #1890ff;">
          <p><strong>Answer:</strong> ${answer.correctAnswer || "Not specified"
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

/**
 * Convert Exam Content to HTML (SPM Paper 1 & 2)
 * CRITICAL: Automatically appends answer sheet for Paper 1
 */
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
          <p><strong>Duration:</strong> ${examContent.duration || "90 minutes"
    } | <strong>${paperType === "paper1" ? "Questions:" : "Parts:"} ${examContent.totalQuestions || examContent.totalParts || 40
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
    examContent.parts.forEach((part, partIndex) => {
      if (!part) return;

      html += `
        <div class="exam-part" style="margin-bottom: 30px; page-break-before: auto;">
          <h3 style="color: #52c41a; border-bottom: 1px solid #b7eb8f; padding-bottom: 8px;">${part.title || `Part ${part.partNumber || partIndex + 1}`
        }</h3>
          <p style="font-style: italic; margin-bottom: 15px;">${part.instructions || ""
        }</p>
          <p style="margin-bottom: 20px;">
            <strong>Word Count:</strong> ${part.wordCount || "N/A"} |
            <strong>Time:</strong> ${part.timeAllocation || "N/A"} |
            <strong>Marks:</strong> ${part.marks || "N/A"}
          </p>
      `;

      // Paper 2 Part 1: Short Communicative Message
      if (paperType === "paper2" && part.partNumber === 1 && part.scenario) {
        html += `
          <div class="part-content" style="background: #f6ffed; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h4 style="color: #52c41a; margin-bottom: 10px;">📧 Scenario:</h4>
            <p style="margin-bottom: 15px;">${part.scenario}</p>

            <h4 style="color: #1890ff; margin-bottom: 10px;">📝 Task:</h4>
            <p style="margin-bottom: 15px; font-weight: 500;">${part.task}</p>

            <h4 style="color: #fa8c16; margin-bottom: 10px;">✅ You must include:</h4>
            <ul style="margin: 0; padding-left: 25px;">`;

        if (part.requiredContent && Array.isArray(part.requiredContent)) {
          part.requiredContent.forEach(item => {
            html += `<li style="margin-bottom: 5px;">${item}</li>`;
          });
        }

        html += `
            </ul>
          </div>
          <div class="answer-space" style="min-height: 150px; border: 2px solid #d9d9d9; background: white; border-radius: 5px; padding: 10px; margin-top: 15px;">
            <p style="color: #999; font-style: italic;">Write your ${part.format || "email"} here (approximately ${part.wordCount || "80 words"})...</p>
          </div>`;
      }

      // Paper 2 Part 2: Guided Writing
      else if (paperType === "paper2" && part.partNumber === 2 && part.topic) {
        html += `
          <div class="part-content" style="background: #e6f7ff; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h4 style="color: #1890ff; margin-bottom: 10px;">📖 Topic:</h4>
            <p style="margin-bottom: 15px; font-weight: 600; font-size: 12pt;">${part.topic}</p>

            <h4 style="color: #fa8c16; margin-bottom: 10px;">📋 Use the following points:</h4>
            <ul style="margin: 0 0 15px 0; padding-left: 25px;">`;

        if (part.guidingPoints && Array.isArray(part.guidingPoints)) {
          part.guidingPoints.forEach(point => {
            html += `<li style="margin-bottom: 5px; font-weight: 500;">${point}</li>`;
          });
        }

        html += `
            </ul>

            <div style="background: #fff7e6; padding: 10px; border-left: 4px solid #fa8c16; border-radius: 4px; margin-top: 10px;">
              <p style="margin: 0; font-weight: 500;">${part.taskInstructions || "Use all the notes above and give reasons for your point of view. Write your essay in an appropriate style."}</p>
            </div>
          </div>
          <div class="answer-space" style="min-height: 200px; border: 2px solid #d9d9d9; background: white; border-radius: 5px; padding: 10px; margin-top: 15px;">
            <p style="color: #999; font-style: italic;">Write your essay here (${part.wordCount || "125-150 words"})...</p>
          </div>`;
      }

      // Paper 2 Part 3: Extended Writing
      else if (paperType === "paper2" && part.partNumber === 3 && part.options) {
        html += `
          <div class="part-content" style="margin-bottom: 20px;">
            <p style="background: #fff7e6; padding: 12px; border-left: 4px solid #fa8c16; border-radius: 4px; font-weight: 500; margin-bottom: 20px;">
              ${part.instructions || "Choose ONE of the following questions."}
            </p>`;

        part.options.forEach((option, idx) => {
          const colors = ["#1890ff", "#52c41a", "#722ed1"];
          const bgColors = ["#e6f7ff", "#f6ffed", "#f9f0ff"];
          const color = colors[idx % 3];
          const bgColor = bgColors[idx % 3];

          html += `
            <div class="option" style="background: ${bgColor}; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 2px solid ${color};">
              <h4 style="color: ${color}; margin-bottom: 10px;">
                ${option.questionNumber || `Question ${idx + 1}`} - ${option.type ? option.type.charAt(0).toUpperCase() + option.type.slice(1) : ""}
              </h4>

              <h5 style="color: #262626; margin: 10px 0; font-size: 11pt;">📌 Topic: ${option.topic || "N/A"}</h5>

              <div style="background: white; padding: 12px; border-radius: 5px; margin: 10px 0;">
                <p style="margin: 0; font-weight: 500;">${option.prompt || ""}</p>
              </div>`;

          if (option.notes && Array.isArray(option.notes)) {
            html += `
              <div style="margin-top: 10px;">
                <p style="font-weight: 600; margin-bottom: 5px;">Consider the following:</p>
                <ul style="margin: 5px 0; padding-left: 25px;">`;
            option.notes.forEach(note => {
              html += `<li style="margin-bottom: 5px;">${note}</li>`;
            });
            html += `</ul></div>`;
          }

          if (option.requirements && Array.isArray(option.requirements)) {
            html += `
              <div style="margin-top: 10px;">
                <p style="font-weight: 600; margin-bottom: 5px;">Your ${option.type || "writing"} should:</p>
                <ul style="margin: 5px 0; padding-left: 25px;">`;
            option.requirements.forEach(req => {
              html += `<li style="margin-bottom: 5px;">${req}</li>`;
            });
            html += `</ul></div>`;
          }

          html += `</div>`;
        });

        html += `
          </div>
          <div class="answer-space" style="min-height: 300px; border: 2px solid #d9d9d9; background: white; border-radius: 5px; padding: 10px; margin-top: 15px;">
            <p style="color: #999; font-style: italic;">Write your answer here (${part.wordCount || "200-250 words"})...</p>
            <p style="color: #999; font-style: italic; margin-top: 10px;">Remember to indicate which question you are answering (e.g., Question 3A, 3B, or 3C)</p>
          </div>`;
      }

      // Paper 1 specific content (existing code)
      else {

      // Display passage if exists
      if (part.passage) {
        html += `<div class="passage" style="background: #f6ffed; padding: 15px; border-radius: 8px; margin-bottom: 20px; white-space: pre-wrap;">
          ${part.passage}
        </div>`;
      }

      // Handle Part 5's special structure
      if (
        part.partNumber === 5 &&
        part.questions &&
        Array.isArray(part.questions)
      ) {
        part.questions.forEach((questionGroup) => {
          if (!questionGroup) return;

          if (questionGroup.questionType === "matching") {
            html += `
              <div class="question-group" style="margin: 20px 0; padding: 15px; background: #fff7e6; border-radius: 8px;">
                <h4 style="color: #fa8c16; margin-bottom: 10px;">Questions ${questionGroup.questionNumbers || "33-36"
              }</h4>
                <p style="margin-bottom: 15px;"><strong>${questionGroup.instructions ||
              "Match the statements to the paragraphs"
              }</strong></p>
                
                <div class="matching-questions">`;

            if (
              questionGroup.questions &&
              Array.isArray(questionGroup.questions)
            ) {
              questionGroup.questions.forEach((q) => {
                html += `
                  <div class="question" style="margin-bottom: 15px; padding: 10px; background: white; border-left: 3px solid #fa8c16; border-radius: 4px;">
                    <p><strong>${q.questionNumber}.</strong> ${q.statement}</p>
                    <p style="margin-top: 8px; color: #666;"><em>Answer: _______</em></p>
                  </div>`;
              });
            }

            html += `
                </div>
              </div>`;
          } else if (questionGroup.questionType === "information_transfer") {
            html += `
              <div class="question-group" style="margin: 20px 0; padding: 15px; background: #e6f7ff; border-radius: 8px;">
                <h4 style="color: #1890ff; margin-bottom: 10px;">Questions ${questionGroup.questionNumbers || "37-40"
              }</h4>
                <p style="margin-bottom: 15px;"><strong>${questionGroup.instructions ||
              "Complete the sentences with ONE WORD from the passage"
              }</strong></p>
                ${questionGroup.title
                ? `<p style="font-weight: 600; margin-bottom: 10px;">${questionGroup.title}</p>`
                : ""
              }
                
                <div class="transfer-questions">`;

            if (
              questionGroup.questions &&
              Array.isArray(questionGroup.questions)
            ) {
              questionGroup.questions.forEach((q) => {
                html += `
      <div class="question" style="margin-bottom: 15px; padding: 10px; background: white; border-left: 3px solid #1890ff; border-radius: 4px;">
        <p>
          <strong>${q.questionNumber}.</strong> ${q.sentence}
        </p>
        <div style="margin-top: 10px; padding: 8px; background: #fafafa; border: 1px dashed #d9d9d9; border-radius: 4px;">
          <p style="color: #666;">
            <em>Write your answer here: _________________</em>
          </p>
        </div>
      </div>`;
              });
            }
            html += `</div></div>`;
          }
        });
      }
      // Regular question handling for Parts 1-4
      else if (part.questions && Array.isArray(part.questions)) {
        part.questions.forEach((question) => {
          if (!question) return;

          html += `<div class="question-wrapper"><div class="question" style="margin-bottom: 20px; padding: 10px; border: 1px solid #f0f0f0; border-radius: 5px;">
        <p><strong>${question.questionNumber || ""}.</strong> ${question.question || question.text || ""
            }</p>`;

          if (question.options && Array.isArray(question.options)) {
            html += `<div class="options" style="margin-left: 20px;">`;
            question.options.forEach((option) => {
              html += `<p style="margin: 5px 0;">${option}</p>`;
            });
            html += `</div>`;
          }
          html += `</div></div>`;
        });
      }

      // Display sentence options for Part 4
      if (part.sentenceOptions && Array.isArray(part.sentenceOptions)) {
        html += `<div class="sentence-options" style="margin: 20px 0; padding: 15px; background: #f6ffed; border-radius: 8px;">
      <h4 style="color: #52c41a;">Choose from these sentences:</h4>`;
        part.sentenceOptions.forEach((option) => {
          html += `<p style="margin: 8px 0; padding: 8px; background: white; border-left: 3px solid #52c41a; border-radius: 4px;">${option}</p>`;
        });
        html += `</div>`;
      }

      } // Close else block for Paper 1 content

      html += `</div>`; // Close exam-part
    });
  }
  html += `</div></body></html>`;
  // CRITICAL: Append answer sheet ONLY for Paper 1
  if (paperType === "paper1") {
    console.log("✅ Appending SPM Paper 1 answer sheet");
    html = html.replace(
      "</div></body></html>",
      generateSpmAnswerSheetHTML() + "</div></body></html>"
    );
  }
  return html;
};
// Export all template functions
module.exports = {
  getEnhancedPdfStyles,
  generateSpmAnswerSheetHTML,
  convertActivityToHTML,
  convertAssessmentToHTML,
  convertRubricToHTML,
  convertSpmPaper2RubricToHTML,
  convertAnswerKeyToHTML,
  convertExamToHTML,
};
