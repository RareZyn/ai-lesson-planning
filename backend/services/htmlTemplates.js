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
    
    .question, .question-wrapper, .answer-item, .exam-part {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      margin-bottom: 8px;
    }
    
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

/**
 * Generate SPM Paper 1 Answer Sheet HTML
 * This will always be appended to Paper 1 exports
 */
const generateSpmAnswerSheetHTML = () => {
  return `
    <div class="spm-answer-sheet" style="page-break-before: always; width: 210mm; min-height: 297mm; padding: 10mm; background: white; font-family: Arial, sans-serif; font-size: 9pt; box-sizing: border-box;">
      <!-- Header -->
      <div style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 5px;">
            <span style="font-size: 10pt;">NAMA</span>
            <span>:</span>
            <span style="border-bottom: 1px solid #000; width: 250px; display: inline-block;"></span>
          </div>
          <div style="font-size: 14pt; font-weight: bold;">SPM</div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 5px;">
            <span style="font-size: 10pt;">ANGKA GILIRAN :</span>
            <span style="border-bottom: 1px solid #000; width: 150px; display: inline-block;"></span>
          </div>
          <div style="display: flex; align-items: center; gap: 5px;">
            <span style="font-size: 10pt;">TINGKATAN :</span>
            <span style="border-bottom: 1px solid #000; width: 100px; display: inline-block;"></span>
          </div>
        </div>
      </div>

      <!-- MCQ Answer Grid -->
      <div style="margin-bottom: 12px;">
        <table style="width: 100%; border-collapse: collapse; border: 2px solid #000;">
          <thead>
            <tr>
              <th colspan="2" style="border: 1px solid #000; padding: 4px 8px; text-align: center; font-weight: bold; font-size: 9pt;">
                ANSWER BOX FOR LETTERS<br/>(MULTIPLE CHOICE)
              </th>
              <th style="border: 1px solid #000; padding: 4px 8px; text-align: center; font-weight: bold; font-size: 9pt;">
                SPACE FOR ANSWER THAT ARE<br/>A WORD, PHRASE OR NUMBER
              </th>
            </tr>
          </thead>
          <tbody>
            ${Array.from({ length: 40 }, (_, i) => i + 1)
              .map(
                (qNum) => `
              <tr>
                <td style="border: 1px solid #000; padding: 3px 8px; width: 25px; text-align: center; font-weight: bold;">
                  ${qNum}
                </td>
                <td style="border: 1px solid #000; padding: 3px 8px; text-align: center;">
                  <div style="display: flex; justify-content: center; align-items: center; gap: 6px; flex-wrap: wrap;">
                    ${["A", "B", "C", "D", "E", "F", "G", "H"]
                      .map(
                        (letter) => `
                      <div style="display: inline-flex; align-items: center; gap: 2px;">
                        <span style="font-size: 8pt; font-weight: bold;">${letter}</span>
                        <div style="width: 12px; height: 12px; border: 1.5px solid #000; border-radius: 50%; background-color: #fff;"></div>
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 3px 8px;"></td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <!-- Footer Note -->
      <div style="margin-top: 10px; text-align: right; font-size: 8pt; font-style: italic;">
        [ Lihat halaman sebelah
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

/**
 * Convert Rubric Content to HTML
 */
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

/**
 * Convert Answer Key Content to HTML
 */
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
    examContent.parts.forEach((part, partIndex) => {
      if (!part) return;

      html += `
        <div class="exam-part" style="margin-bottom: 30px; page-break-before: auto;">
          <h3 style="color: #52c41a; border-bottom: 1px solid #b7eb8f; padding-bottom: 8px;">${
            part.title || `Part ${part.partNumber || partIndex + 1}`
          }</h3>
          <p style="font-style: italic; margin-bottom: 15px;">${
            part.instructions || ""
          }</p>
          <p style="margin-bottom: 20px;"><strong>Total Questions:</strong> ${
            part.totalQuestions || "N/A"
          } | <strong>Marks:</strong> ${part.marks || "N/A"}</p>
      `;

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
                <h4 style="color: #fa8c16; margin-bottom: 10px;">Questions ${
                  questionGroup.questionNumbers || "33-36"
                }</h4>
                <p style="margin-bottom: 15px;"><strong>${
                  questionGroup.instructions ||
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
                <h4 style="color: #1890ff; margin-bottom: 10px;">Questions ${
                  questionGroup.questionNumbers || "37-40"
                }</h4>
                <p style="margin-bottom: 15px;"><strong>${
                  questionGroup.instructions ||
                  "Complete the sentences with ONE WORD from the passage"
                }</strong></p>
                ${
                  questionGroup.title
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
                    <p><strong>${q.questionNumber}.</strong> ${q.sentence}</p>
                    <div style="margin-top: 10px; padding: 8px; background: #fafafa; border: 1px dashed #d9d9d9; border-radius: 4px;">
                      <p style="color: #666;"><em>Write your answer here: _________________</em></p>
                    </div>
                  </div>`;
              });
            }

            html += `
                </div>
              </div>`;
          }
        });
      }
      // Regular question handling for Parts 1-4
      else if (part.questions && Array.isArray(part.questions)) {
        part.questions.forEach((question) => {
          if (!question) return;

          html += `<div class="question-wrapper"><div class="question" style="margin-bottom: 20px; padding: 10px; border: 1px solid #f0f0f0; border-radius: 5px;">
            <p><strong>${question.questionNumber || ""}.</strong> ${
            question.question || question.text || ""
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
  convertAnswerKeyToHTML,
  convertExamToHTML,
};
