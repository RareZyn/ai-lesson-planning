// Updated src/pages/assessment/ActivityViewerPage.jsx - Fixed SPM exam content detection
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Spin,
  Alert,
  message,
  Typography,
  Tag,
  Space,
  Tooltip,
} from "antd";
import {
  ArrowLeftOutlined,
  EyeOutlined,
  DownloadOutlined,
  PrinterOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { assessmentAPI } from "../../services/assessmentService";
import { exportAssessmentToPdf } from "../../utils/assessmentPdfExport";
import { printAssessmentContent } from "../../utils/assessmentPrint";
import { isOnline } from "../../services/networkStatus";
import EditQuestionModal from "../../components/Modal/Assessment/EditQuestionModal";

const { Title, Text } = Typography;

// JSON to HTML conversion functions for fallback support
const convertActivityContentToHTML = (activityContent, activityType) => {
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

  // Essay-specific content
  if (activityType === "essay") {
    if (activityContent.essayType) {
      html += `<div style="margin-bottom: 15px;">
        <p><strong>Essay Type:</strong> ${
          activityContent.essayType.charAt(0).toUpperCase() +
          activityContent.essayType.slice(1)
        }</p>
      </div>`;
    }

    if (activityContent.topic) {
      html += `<div style="margin-bottom: 15px;">
        <p><strong>Topic:</strong> ${activityContent.topic}</p>
      </div>`;
    }

    if (activityContent.prompt) {
      html += `<div class="essay-prompt" style="margin-bottom: 20px; padding: 20px; background: #fff7e6; border: 2px solid #ffa940; border-radius: 8px;">
        <h3 style="color: #fa8c16;">Essay Prompt:</h3>
        <p style="font-size: 16px; font-weight: 500;">${activityContent.prompt}</p>
      </div>`;
    }

    if (
      activityContent.instructions &&
      activityContent.instructions.length > 0
    ) {
      html += `<div class="instructions" style="margin-bottom: 25px;">
        <h3 style="color: #fa8c16;">Instructions:</h3>
        <ol style="padding-left: 20px;">`;
      activityContent.instructions.forEach((instruction) => {
        html += `<li style="margin-bottom: 8px;">${instruction}</li>`;
      });
      html += `</ol></div>`;
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
  }

  html += `</div>`;
  return html;
};

const convertAssessmentContentToHTML = (assessmentContent) => {
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

const convertRubricContentToHTML = (rubricContent) => {
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
      </table>`;

    if (rubricContent.totalPoints) {
      html += `<div class="grading-info" style="margin-top: 25px; padding: 15px; background: #e6f7ff; border-radius: 8px;">
        <h3 style="color: #1890ff; margin-bottom: 15px;">Grading Information</h3>
        <p><strong>Total Points:</strong> ${rubricContent.totalPoints}</p>`;

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
  }

  html += `</div>`;
  return html;
};

const convertAnswerKeyContentToHTML = (answerKeyContent) => {
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

  html += `</div>`;
  return html;
};

const ActivityViewerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [showEditWarning, setShowEditWarning] = useState(false);

  const fetchAssessment = useCallback(async () => {
    try {
      setLoading(true);

      const response = await assessmentAPI.getAssessmentById(id);

      if (response.success && response.data) {
        setAssessment(response.data);

        // FIXED: Enhanced content validation for SPM exams
        const hasStudentContent = getStudentContentFromData(response.data);

        if (!hasStudentContent) {
          console.warn(
            "No student content found for activity type:",
            response.data.activityType,
            "Content status:",
            {
              activityHTML: !!response.data.generatedContent?.activityHTML,
              assessmentHTML: !!response.data.generatedContent?.assessmentHTML,
              examHTML: !!response.data.generatedContent?.examHTML,
            }
          );
          setError("No student content found for this assessment.");
        }
      } else {
        console.error("API response unsuccessful or no data:", response);
        setError("Assessment not found.");
      }
    } catch (error) {
      console.error("Error fetching assessment:", error);

      // Check if offline and show appropriate message
      if (!isOnline()) {
        setError("Offline assessment only");
        message.warning("Offline assessment only", 3);
      } else {
        setError("Failed to load assessment. Please try again.");
        message.error("Failed to load assessment");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAssessment();
  }, [fetchAssessment]);

  // FIXED: Enhanced helper function to check content availability from raw data
  const getStudentContentFromData = (assessmentData) => {
    if (!assessmentData?.generatedContent) return null;

    const { activityHTML, assessmentHTML, examHTML } =
      assessmentData.generatedContent;

    // CRITICAL: Handle SPM exam content correctly
    if (assessmentData.activityType === "spm-exam") {
      // For SPM exams, check examHTML first, then assessmentHTML as fallback
      return examHTML || assessmentHTML;
    } else if (assessmentData.activityType === "assessment") {
      // For regular assessments, use assessmentHTML
      return assessmentHTML;
    } else {
      // For other activity types, use activityHTML
      return activityHTML;
    }
  };

  // FIXED: Enhanced getStudentContent function with SPM exam support
  const getStudentContent = () => {
    if (!assessment?.generatedContent) {
      return null;
    }

    const {
      activityHTML,
      assessmentHTML,
      examHTML,
      activityContent,
      assessmentContent,
      examContent,
    } = assessment.generatedContent;

    if (assessment.activityType === "spm-exam") {
      if (examHTML) {
        return examHTML;
      } else if (assessmentHTML) {
        return assessmentHTML;
      } else if (examContent) {
        return convertAssessmentContentToHTML(examContent);
      } else if (assessmentContent) {
        return convertAssessmentContentToHTML(assessmentContent);
      }
    } else if (assessment.activityType === "assessment") {
      // For regular assessments: assessmentHTML -> assessmentContent
      if (assessmentHTML) {
        return assessmentHTML;
      } else if (assessmentContent) {
        return convertAssessmentContentToHTML(assessmentContent);
      }
    } else {
      // For other types: activityHTML -> activityContent
      if (activityHTML) {
        return activityHTML;
      } else if (activityContent) {
        return convertActivityContentToHTML(
          activityContent,
          assessment.activityType
        );
      }
    }

    return null;
  };

  // FIXED: Enhanced getTeacherContent function with SPM exam support
  const getTeacherContent = () => {
    if (!assessment?.generatedContent) return null;

    const { rubricHTML, answerKeyHTML, rubricContent, answerKeyContent } =
      assessment.generatedContent;

    // CRITICAL: Handle SPM exam teacher content correctly
    if (
      assessment.activityType === "spm-exam" ||
      assessment.activityType === "assessment"
    ) {
      // For SPM exams and assessments, use answer key content
      if (answerKeyHTML) {
        return answerKeyHTML;
      } else if (answerKeyContent) {
        return convertAnswerKeyContentToHTML(answerKeyContent);
      }
    } else {
      // For other types, use rubric content
      if (rubricHTML) {
        return rubricHTML;
      } else if (rubricContent) {
        return convertRubricContentToHTML(rubricContent);
      }
    }

    return null;
  };

  // Check if teacher content exists
  const hasTeacherContent = () => {
    const teacherContent = getTeacherContent();
    const hasContent = !!teacherContent;
    return hasContent;
  };

  // Get editable content items from assessment for editing
  const getEditableContentFromAssessment = () => {
    if (!assessment?.generatedContent) return { items: [], contentType: null };

    const { assessmentContent, activityContent, examContent } =
      assessment.generatedContent;

    // For assessment type - get questions
    if (assessment.activityType === "assessment") {
      const content = assessmentContent;
      if (content?.questions && Array.isArray(content.questions)) {
        return { items: content.questions, contentType: "questions" };
      }
    }

    // For SPM exam - questions are nested inside parts[]
    if (assessment.activityType === "spm-exam") {
      const content = examContent || assessmentContent;

      // SPM Paper structure: questions are inside parts[].questions
      if (content?.parts && Array.isArray(content.parts)) {
        const allQuestions = [];
        content.parts.forEach((part, partIndex) => {
          if (part.questions && Array.isArray(part.questions)) {
            part.questions.forEach((question, qIndex) => {
              allQuestions.push({
                ...question,
                partNumber: part.partNumber || partIndex + 1,
                partTitle: part.title || `Part ${partIndex + 1}`,
                questionNumber: question.questionNumber || qIndex + 1,
                question: question.question || question.text || "",
                type: question.type || "multiple_choice",
                points: question.marks || 1,
                options: question.options || [],
                // Store original indices for saving
                _partIndex: partIndex,
                _questionIndex: qIndex,
              });
            });
          }
        });
        if (allQuestions.length > 0) {
          return { items: allQuestions, contentType: "spm-questions" };
        }
      }

      // Fallback: check if questions are at top level
      if (content?.questions && Array.isArray(content.questions)) {
        return { items: content.questions, contentType: "questions" };
      }
    }

    // For essay type - get prompt and guidelines as editable items
    if (assessment.activityType === "essay" && activityContent) {
      const items = [];
      if (activityContent.prompt) {
        items.push({
          type: "prompt",
          content: activityContent.prompt,
          label: "Essay Prompt",
        });
      }
      if (activityContent.guidelines && Array.isArray(activityContent.guidelines)) {
        activityContent.guidelines.forEach((guideline, index) => {
          items.push({
            type: "guideline",
            index,
            content: guideline,
            label: `Guideline ${index + 1}`,
          });
        });
      }
      if (activityContent.instructions && Array.isArray(activityContent.instructions)) {
        activityContent.instructions.forEach((instruction, index) => {
          items.push({
            type: "instruction",
            index,
            content: instruction,
            label: `Instruction ${index + 1}`,
          });
        });
      }
      return { items, contentType: "essay" };
    }

    // For activity/activityInClass type - get activities
    if ((assessment.activityType === "activity" || assessment.activityType === "activityInClass") && activityContent) {
      const items = [];
      if (activityContent.activities && Array.isArray(activityContent.activities)) {
        activityContent.activities.forEach((section, sectionIndex) => {
          if (section.tasks && Array.isArray(section.tasks)) {
            section.tasks.forEach((task, taskIndex) => {
              items.push({
                type: "task",
                sectionIndex,
                taskIndex,
                section: section.section,
                content: task,
                label: `${section.section} - Task ${taskIndex + 1}`,
              });
            });
          }
        });
      }
      if (activityContent.instructions && Array.isArray(activityContent.instructions)) {
        activityContent.instructions.forEach((instruction, index) => {
          items.push({
            type: "instruction",
            index,
            content: instruction,
            label: `Instruction ${index + 1}`,
          });
        });
      }
      return { items, contentType: "activity" };
    }

    // For textbook type - get tasks and questions
    if (assessment.activityType === "textbook" && activityContent) {
      const items = [];
      ["preActivity", "mainActivity", "postActivity"].forEach((phase) => {
        if (activityContent[phase] && Array.isArray(activityContent[phase])) {
          activityContent[phase].forEach((task, index) => {
            items.push({
              type: phase,
              index,
              content: task,
              label: `${phase.replace(/([A-Z])/g, " $1").trim()} - Task ${index + 1}`,
            });
          });
        }
      });
      if (activityContent.questions && Array.isArray(activityContent.questions)) {
        activityContent.questions.forEach((question, index) => {
          items.push({
            type: "question",
            index,
            content: question.question,
            questionType: question.type,
            label: `Question ${index + 1}`,
            original: question,
          });
        });
      }
      return { items, contentType: "textbook" };
    }

    // Fallback - try to get questions array from any content
    if (activityContent?.questions && Array.isArray(activityContent.questions)) {
      return { items: activityContent.questions, contentType: "questions" };
    }

    if (assessmentContent?.questions && Array.isArray(assessmentContent.questions)) {
      return { items: assessmentContent.questions, contentType: "questions" };
    }

    return { items: [], contentType: null };
  };

  // Handle opening the edit modal for a question
  const handleEditQuestion = (question, index) => {
    setSelectedQuestion(question);
    setSelectedQuestionIndex(index);
    setEditModalOpen(true);
    setShowEditWarning(true);
  };

  // Handle saving an edited question
  const handleSaveQuestion = async (updatedQuestion, index) => {
    try {
      const { contentType } = getEditableContentFromAssessment();

      // Determine which content field to update
      let contentField = "assessmentContent";
      if (assessment.activityType === "spm-exam") {
        contentField = assessment.generatedContent?.examContent ? "examContent" : "assessmentContent";
      } else if (assessment.activityType !== "assessment") {
        contentField = "activityContent";
      }

      // Get the current content - deep copy to avoid mutation
      const currentContent = JSON.parse(JSON.stringify(assessment.generatedContent[contentField]));

      // Update based on content type
      if (contentType === "spm-questions") {
        // Handle SPM Paper questions (nested inside parts[])
        const partIndex = updatedQuestion._partIndex;
        const questionIndex = updatedQuestion._questionIndex;

        if (currentContent.parts && currentContent.parts[partIndex]?.questions) {
          // Remove the helper properties before saving
          const { _partIndex, _questionIndex, partNumber, partTitle, ...cleanedQuestion } = updatedQuestion;

          // Update the question in the correct part
          currentContent.parts[partIndex].questions[questionIndex] = {
            ...currentContent.parts[partIndex].questions[questionIndex],
            ...cleanedQuestion,
            // Map back the field names
            text: cleanedQuestion.question || cleanedQuestion.text,
            marks: cleanedQuestion.points || cleanedQuestion.marks,
          };
        }
      } else if (contentType === "questions") {
        // Handle questions array update
        const questions = [...(currentContent.questions || [])];
        questions[index] = updatedQuestion;
        currentContent.questions = questions;
      } else if (contentType === "essay") {
        // Handle essay content update
        const item = updatedQuestion; // The updated item
        if (item.type === "prompt") {
          currentContent.prompt = item.content;
        } else if (item.type === "guideline") {
          if (!currentContent.guidelines) currentContent.guidelines = [];
          currentContent.guidelines[item.index] = item.content;
        } else if (item.type === "instruction") {
          if (!currentContent.instructions) currentContent.instructions = [];
          currentContent.instructions[item.index] = item.content;
        }
      } else if (contentType === "activity") {
        // Handle activity content update
        const item = updatedQuestion;
        if (item.type === "task") {
          if (currentContent.activities && currentContent.activities[item.sectionIndex]) {
            currentContent.activities[item.sectionIndex].tasks[item.taskIndex] = item.content;
          }
        } else if (item.type === "instruction") {
          if (!currentContent.instructions) currentContent.instructions = [];
          currentContent.instructions[item.index] = item.content;
        }
      } else if (contentType === "textbook") {
        // Handle textbook content update
        const item = updatedQuestion;
        if (["preActivity", "mainActivity", "postActivity"].includes(item.type)) {
          if (!currentContent[item.type]) currentContent[item.type] = [];
          currentContent[item.type][item.index] = item.content;
        } else if (item.type === "question") {
          if (!currentContent.questions) currentContent.questions = [];
          currentContent.questions[item.index] = {
            ...currentContent.questions[item.index],
            question: item.content,
          };
        }
      }

      // Prepare the update data
      const updateData = {
        generatedContent: {
          ...assessment.generatedContent,
          [contentField]: currentContent,
        },
      };

      // Generate new HTML
      let newHTML;
      if (contentField === "assessmentContent" || contentField === "examContent") {
        newHTML = convertAssessmentContentToHTML(currentContent);
        updateData.generatedContent[contentField === "examContent" ? "examHTML" : "assessmentHTML"] = newHTML;
      } else {
        newHTML = convertActivityContentToHTML(currentContent, assessment.activityType);
        updateData.generatedContent.activityHTML = newHTML;
      }

      // Call API to update assessment
      const response = await assessmentAPI.updateAssessment(assessment._id, updateData);

      if (response.success || response.data) {
        message.success("Content updated successfully!");
        // Refresh the assessment data
        await fetchAssessment();
      } else {
        throw new Error(response.message || "Failed to update content");
      }
    } catch (error) {
      console.error("Error saving content:", error);
      message.error(error.message || "Failed to save content");
    }
  };

  // Check if editing is available (has parseable content)
  const canEditQuestions = () => {
    const { items } = getEditableContentFromAssessment();
    return items.length > 0;
  };

  const handleViewRubric = () => {
    if (hasTeacherContent()) {
      navigate(`/app/assessment/${id}/${id}`);
    } else {
      message.warning(
        `No ${getTeacherContentName()} available for this assessment.`
      );
    }
  };

  const handleGoBack = () => {
    navigate("/app/assessment");
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const studentContent = getStudentContent();

      if (!studentContent) {
        message.error("No content available to download");
        return;
      }

      // Determine if this is SPM Paper 1
      const isSpmPaper1 =
        assessment.activityType === "spm-exam" &&
        assessment.examConfiguration?.paperType === "paper1";

      // Create a safe filename
      const safeTitle = assessment.title
        .replace(/[^a-z0-9]/gi, "_")
        .substring(0, 50);
      const fileName = `${safeTitle}_${getContentTypeName().replace(
        /[^a-z0-9]/gi,
        "_"
      )}.pdf`;

      await exportAssessmentToPdf(studentContent, {
        fileName,
        title: assessment.title,
        isSpmPaper1,
        paperType: assessment.examConfiguration?.paperType,
      });

      message.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      message.error("Failed to download PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    try {
      setPrinting(true);
      const studentContent = getStudentContent();

      if (!studentContent) {
        message.error("No content available to print");
        return;
      }

      // Determine if this is SPM Paper 1
      const isSpmPaper1 =
        assessment.activityType === "spm-exam" &&
        assessment.examConfiguration?.paperType === "paper1";

      await printAssessmentContent(studentContent, {
        title: `${assessment.title} - ${getContentTypeName()}`,
        isSpmPaper1,
      });

      message.success("Print dialog opened!");
    } catch (error) {
      console.error("Error printing:", error);
      message.error("Failed to open print dialog. Please try again.");
    } finally {
      setPrinting(false);
    }
  };

  // FIXED: Get appropriate content type name with SPM exam support
  const getContentTypeName = () => {
    if (!assessment) return "Content";

    switch (assessment.activityType) {
      case "assessment":
        return "Assessment Paper";
      case "spm-exam":
        return "SPM Examination Paper";
      case "essay":
        return "Essay Activity";
      case "textbook":
        return "Textbook Activity";
      case "activity":
        return "Class Activity";
      default:
        return "Activity";
    }
  };

  // FIXED: Get appropriate teacher content name with SPM exam support
  const getTeacherContentName = () => {
    if (!assessment) return "Teacher Content";

    switch (assessment.activityType) {
      case "assessment":
      case "spm-exam":
        return "Answer Key";
      case "essay":
      case "textbook":
      case "activity":
        return "Rubric";
      default:
        return "Teacher Guide";
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Spin size="large" tip="Loading assessment content..." />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Alert
          message="Error Loading Assessment"
          description={
            <div>
              <div>{error}</div>
              {assessment && (
                <div style={{ marginTop: "8px", fontSize: "12px" }}>
                  <strong>Debug Info:</strong>
                  <br />
                  Activity Type: {assessment.activityType}
                  <br />
                  Content Available:{" "}
                  {JSON.stringify({
                    activityHTML: !!assessment.generatedContent?.activityHTML,
                    assessmentHTML:
                      !!assessment.generatedContent?.assessmentHTML,
                    examHTML: !!assessment.generatedContent?.examHTML,
                    rubricHTML: !!assessment.generatedContent?.rubricHTML,
                    answerKeyHTML: !!assessment.generatedContent?.answerKeyHTML,
                  })}
                </div>
              )}
            </div>
          }
          type="error"
          showIcon
          action={
            <Space>
              <Button size="small" onClick={fetchAssessment}>
                Retry
              </Button>
              <Button size="small" onClick={handleGoBack}>
                Go Back
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div>
        <Alert
          message="Assessment Not Found"
          description="The requested assessment could not be found."
          type="warning"
          showIcon
          action={
            <Button size="small" onClick={handleGoBack}>
              Go Back
            </Button>
          }
        />
      </div>
    );
  }

  const studentContent = getStudentContent();

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <Card
        style={{ marginBottom: "24px" }}
        bodyStyle={{ padding: "20px 24px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handleGoBack}
                type="text"
                size="small"
              >
                Back to Assessments
              </Button>
            </div>

            <Title level={3} style={{ margin: "0 0 8px 0" }}>
              {assessment.title}
            </Title>

            {assessment.description && (
              <Text type="secondary" style={{ fontSize: "14px" }}>
                {assessment.description}
              </Text>
            )}

            <div style={{ marginTop: "12px" }}>
              <Space wrap>
                <Tag color="blue">{assessment.activityType.toUpperCase()}</Tag>
                <Tag color="green">{assessment.assessmentType}</Tag>
                <Tag color="purple">{assessment.difficulty}</Tag>
                {assessment.duration && (
                  <Tag color="orange">{assessment.duration}</Tag>
                )}
                {assessment.questionCount && (
                  <Tag>{assessment.questionCount} questions</Tag>
                )}
              </Space>
            </div>

            {assessment.classId && (
              <div style={{ marginTop: "8px" }}>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Class: {assessment.classId.className} • Grade:{" "}
                  {assessment.classId.grade} • Subject:{" "}
                  {assessment.classId.subject}
                </Text>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <Space wrap>
            <Button
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              type="default"
              loading={printing}
              disabled={!studentContent}
            >
              Print
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownloadPdf}
              type="primary"
              loading={downloading}
              disabled={!studentContent}
            >
              Download PDF
            </Button>
            {hasTeacherContent() && (
              <Button
                icon={<EyeOutlined />}
                onClick={handleViewRubric}
                type="default"
              >
                View {getTeacherContentName()}
              </Button>
            )}
          </Space>
        </div>
      </Card>

      {/* Edit Warning Alert */}
      {showEditWarning && (
        <Alert
          message="Question Editing Reminder"
          description={
            <span>
              When you edit questions, remember to <strong>manually update</strong> the
              corresponding answers in the <strong>{getTeacherContentName()}</strong> to ensure
              consistency between questions and answers.
            </span>
          }
          type="warning"
          icon={<ExclamationCircleOutlined />}
          showIcon
          closable
          onClose={() => setShowEditWarning(false)}
          style={{ marginBottom: "24px" }}
          action={
            hasTeacherContent() && (
              <Button size="small" onClick={handleViewRubric}>
                Go to {getTeacherContentName()}
              </Button>
            )
          }
        />
      )}

      {/* Student Content */}
      <Card title={getContentTypeName()} style={{ marginBottom: "24px" }}>
        {studentContent ? (
          <div
            id="activity-content"
            style={{
              background: "#fff",
              border: "1px solid #f0f0f0",
              borderRadius: "8px",
              overflow: "auto",
            }}
            dangerouslySetInnerHTML={{
              __html: studentContent,
            }}
          />
        ) : (
          <Alert
            message="No Student Content"
            description={
              <div>
                <div>
                  No{" "}
                  {assessment.activityType === "spm-exam"
                    ? "exam"
                    : assessment.activityType === "assessment"
                    ? "assessment"
                    : "activity"}{" "}
                  content has been generated for this assessment.
                </div>
                <div style={{ marginTop: "8px", fontSize: "12px" }}>
                  <strong>Debug Info:</strong>
                  <br />
                  Activity Type: {assessment.activityType}
                  <br />
                  Expected Content:{" "}
                  {assessment.activityType === "spm-exam"
                    ? "examHTML or assessmentHTML"
                    : assessment.activityType === "assessment"
                    ? "assessmentHTML"
                    : "activityHTML"}
                  <br />
                  Content Available:{" "}
                  {JSON.stringify({
                    activityHTML: !!assessment.generatedContent?.activityHTML,
                    assessmentHTML:
                      !!assessment.generatedContent?.assessmentHTML,
                    examHTML: !!assessment.generatedContent?.examHTML,
                  })}
                </div>
              </div>
            }
            type="warning"
            showIcon
          />
        )}
      </Card>

      {/* Edit Content Section */}
      {!canEditQuestions() && studentContent && (
        <Card
          title={
            <Space>
              <EditOutlined />
              <span>Edit Content</span>
            </Space>
          }
          style={{ marginBottom: "24px" }}
        >
          <Alert
            message="Editing Not Available"
            description={
              <span>
                This assessment's content is stored in HTML format only and cannot be edited
                individually. To make changes, you can regenerate the assessment with updated
                parameters or contact your administrator.
              </span>
            }
            type="info"
            showIcon
          />
        </Card>
      )}
      {canEditQuestions() && (() => {
        const { items, contentType } = getEditableContentFromAssessment();
        const getEditSectionTitle = () => {
          switch (contentType) {
            case "questions": return "Edit Questions";
            case "spm-questions": return "Edit SPM Exam Questions";
            case "essay": return "Edit Essay Content";
            case "activity": return "Edit Activity Tasks";
            case "textbook": return "Edit Textbook Content";
            default: return "Edit Content";
          }
        };

        return (
          <Card
            title={
              <Space>
                <EditOutlined />
                <span>{getEditSectionTitle()}</span>
              </Space>
            }
            style={{ marginBottom: "24px" }}
            extra={
              <Alert
                message="Remember to update the answer key/rubric after editing"
                type="info"
                showIcon
                icon={<ExclamationCircleOutlined />}
                style={{ margin: 0, padding: "4px 12px" }}
              />
            }
          >
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">
                Click on any item below to edit it. After editing, make sure to update the
                corresponding content in the {getTeacherContentName()}.
              </Text>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {items.map((item, index) => (
                <Card
                  key={index}
                  size="small"
                  hoverable
                  style={{ cursor: "pointer" }}
                  onClick={() => handleEditQuestion(item, index)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      {(contentType === "questions" || contentType === "spm-questions") ? (
                        // Question item display
                        <>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>
                            {contentType === "spm-questions" && item.partTitle && (
                              <Tag color="cyan" style={{ marginRight: 8 }}>
                                {item.partTitle}
                              </Tag>
                            )}
                            Question {item.questionNumber || index + 1}
                            <Tag color="blue" style={{ marginLeft: 8 }}>
                              {item.points || item.marks || 1} {(item.points || item.marks || 1) === 1 ? "mark" : "marks"}
                            </Tag>
                            {item.type && (
                              <Tag color="purple" style={{ marginLeft: 4 }}>
                                {item.type.replace(/_/g, " ")}
                              </Tag>
                            )}
                          </div>
                          <div style={{
                            color: "#666",
                            fontSize: 13,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}>
                            {item.question || item.text || "No question text"}
                          </div>
                        </>
                      ) : (
                        // Other content types (essay, activity, textbook)
                        <>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>
                            {item.label}
                            <Tag
                              color={
                                item.type === "prompt" ? "orange" :
                                item.type === "guideline" ? "purple" :
                                item.type === "instruction" ? "blue" :
                                item.type === "task" ? "green" :
                                item.type === "question" ? "red" :
                                "default"
                              }
                              style={{ marginLeft: 8 }}
                            >
                              {item.type}
                            </Tag>
                          </div>
                          <div style={{
                            color: "#666",
                            fontSize: 13,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}>
                            {item.content || "No content"}
                          </div>
                        </>
                      )}
                    </div>
                    <Tooltip title="Edit this item">
                      <Button
                        type="primary"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditQuestion(item, index);
                        }}
                      >
                        Edit
                      </Button>
                    </Tooltip>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        );
      })()}

      {/* Assessment Details */}
      <Card title="Assessment Details" size="small">
        <div style={{ display: "grid", gap: "16px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            <div>
              <Text strong style={{ display: "block", marginBottom: "4px" }}>
                Content Type
              </Text>
              <Text type="secondary">{getContentTypeName()}</Text>
            </div>

            <div>
              <Text strong style={{ display: "block", marginBottom: "4px" }}>
                Activity Type
              </Text>
              <Text type="secondary">{assessment.activityType}</Text>
            </div>

            <div>
              <Text strong style={{ display: "block", marginBottom: "4px" }}>
                Created Date
              </Text>
              <Text type="secondary">
                {new Date(assessment.createdAt).toLocaleDateString()}
              </Text>
            </div>

            <div>
              <Text strong style={{ display: "block", marginBottom: "4px" }}>
                Last Updated
              </Text>
              <Text type="secondary">
                {new Date(assessment.updatedAt).toLocaleDateString()}
              </Text>
            </div>

            <div>
              <Text strong style={{ display: "block", marginBottom: "4px" }}>
                Status
              </Text>
              <Tag
                color={
                  assessment.status === "Generated" ||
                  assessment.status === "Completed"
                    ? "success"
                    : "processing"
                }
              >
                {assessment.status}
              </Tag>
            </div>

            <div>
              <Text strong style={{ display: "block", marginBottom: "4px" }}>
                Available Content
              </Text>
              <Space>
                {studentContent && <Tag color="blue">Student Content</Tag>}
                {hasTeacherContent() && (
                  <Tag color="green">{getTeacherContentName()}</Tag>
                )}
              </Space>
            </div>

            {assessment.usageCount > 0 && (
              <div>
                <Text strong style={{ display: "block", marginBottom: "4px" }}>
                  Usage Count
                </Text>
                <Text type="secondary">{assessment.usageCount} times</Text>
              </div>
            )}
          </div>

          {/* SPM Exam Configuration Display */}
          {assessment.activityType === "spm-exam" &&
            assessment.examConfiguration && (
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  SPM Exam Configuration
                </Text>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "8px",
                  }}
                >
                  {assessment.examConfiguration.paperType && (
                    <div>
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        Paper Type:{" "}
                        {assessment.examConfiguration.paperType.toUpperCase()}
                      </Text>
                    </div>
                  )}
                  {assessment.examConfiguration.textSources?.length > 0 && (
                    <div>
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        Text Sources:{" "}
                        {assessment.examConfiguration.textSources.length}{" "}
                        selected
                      </Text>
                    </div>
                  )}
                  {assessment.examConfiguration.readingLevel && (
                    <div>
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        Reading Level:{" "}
                        {assessment.examConfiguration.readingLevel}
                      </Text>
                    </div>
                  )}
                  {assessment.examConfiguration.communicationFormat && (
                    <div>
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        Format:{" "}
                        {assessment.examConfiguration.communicationFormat}
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            )}

          {assessment.skills && assessment.skills.length > 0 && (
            <div>
              <Text strong style={{ display: "block", marginBottom: "8px" }}>
                Skills Assessed
              </Text>
              <Space wrap>
                {assessment.skills.map((skill, index) => (
                  <Tag key={index} color="cyan">
                    {skill}
                  </Tag>
                ))}
              </Space>
            </div>
          )}

          {assessment.tags && assessment.tags.length > 0 && (
            <div>
              <Text strong style={{ display: "block", marginBottom: "8px" }}>
                Tags
              </Text>
              <Space wrap>
                {assessment.tags.map((tag, index) => (
                  <Tag key={index}>{tag}</Tag>
                ))}
              </Space>
            </div>
          )}

          {assessment.notes && (
            <div>
              <Text strong style={{ display: "block", marginBottom: "8px" }}>
                Notes
              </Text>
              <Text type="secondary">{assessment.notes}</Text>
            </div>
          )}
        </div>
      </Card>

      {/* Edit Question Modal */}
      <EditQuestionModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedQuestion(null);
        }}
        question={selectedQuestion}
        questionIndex={selectedQuestionIndex}
        onSave={handleSaveQuestion}
        activityType={assessment?.activityType}
      />
    </div>
  );
};

export default ActivityViewerPage;
