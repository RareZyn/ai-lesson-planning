// Updated src/pages/assessment/RubricViewerPage.jsx - Added PDF export functionality
import React, { useState, useEffect } from "react";
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
  Divider,
  Dropdown,
} from "antd";
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  CaretDownOutlined,
} from "@ant-design/icons";
import { assessmentAPI } from "../../services/assessmentService";
import { usePdfExport } from "../../hooks/usePdfExport";

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

const RubricViewerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // PDF Export hook
  const { exportElementToPdf, isExporting } = usePdfExport();

  useEffect(() => {
    fetchAssessment();
  }, [id]);

  const fetchAssessment = async () => {
    try {
      setLoading(true);
      const response = await assessmentAPI.getAssessmentById(id);

      if (response.success && response.data) {
        setAssessment(response.data);

        // FIXED: Check for both rubricHTML and answerKeyHTML
        const hasTeacherContent = !!(
          response.data.generatedContent?.rubricHTML ||
          response.data.generatedContent?.answerKeyHTML
        );

        if (!hasTeacherContent) {
          setError("No teacher content found for this assessment.");
        }
      } else {
        setError("Assessment not found.");
      }
    } catch (error) {
      console.error("Error fetching assessment:", error);
      setError("Failed to load assessment. Please try again.");
      message.error("Failed to load assessment");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced getStudentContent function with JSON fallback
  const getStudentContent = () => {
    if (!assessment?.generatedContent) {
      console.log("No generated content available");
      return null;
    }

    const { activityHTML, assessmentHTML, activityContent, assessmentContent } =
      assessment.generatedContent;

    console.log(
      "Getting student content for activityType:",
      assessment.activityType
    );
    console.log("Available content:", {
      activityHTML: activityHTML ? "Present" : "Missing",
      assessmentHTML: assessmentHTML ? "Present" : "Missing",
      activityContent: activityContent ? "Present (JSON)" : "Missing",
      assessmentContent: assessmentContent ? "Present (JSON)" : "Missing",
    });

    // For assessment type, prefer assessmentHTML, fallback to assessmentContent
    if (assessment.activityType === "assessment") {
      if (assessmentHTML) {
        console.log("Returning existing assessmentHTML");
        return assessmentHTML;
      } else if (assessmentContent) {
        console.log("Converting assessmentContent JSON to HTML");
        return convertAssessmentContentToHTML(assessmentContent);
      }
    } else {
      // For other types, prefer activityHTML, fallback to activityContent
      if (activityHTML) {
        console.log("Returning existing activityHTML");
        return activityHTML;
      } else if (activityContent) {
        console.log("Converting activityContent JSON to HTML");
        return convertActivityContentToHTML(
          activityContent,
          assessment.activityType
        );
      }
    }

    return null;
  };

  // Similarly update getTeacherContent
  const getTeacherContent = () => {
    if (!assessment?.generatedContent) return null;

    const { rubricHTML, answerKeyHTML, rubricContent, answerKeyContent } =
      assessment.generatedContent;

    console.log(
      "Getting teacher content for activityType:",
      assessment.activityType
    );

    // For assessment type, prefer answerKeyHTML, fallback to answerKeyContent
    if (assessment.activityType === "assessment") {
      if (answerKeyHTML) {
        return answerKeyHTML;
      } else if (answerKeyContent) {
        console.log("Converting answerKeyContent JSON to HTML");
        return convertAnswerKeyContentToHTML(answerKeyContent);
      }
    } else {
      // For other types, prefer rubricHTML, fallback to rubricContent
      if (rubricHTML) {
        return rubricHTML;
      } else if (rubricContent) {
        console.log("Converting rubricContent JSON to HTML");
        return convertRubricContentToHTML(rubricContent);
      }
    }

    return null;
  };
  const hasStudentContent = () => {
    return !!getStudentContent();
  };

  // FIXED: Get appropriate content type names
  const getTeacherContentName = () => {
    if (!assessment) return "Teacher Content";

    switch (assessment.activityType) {
      case "assessment":
        return "Answer Key";
      case "essay":
      case "textbook":
      case "activity":
        return "Rubric";
      default:
        return "Teacher Guide";
    }
  };

  const getStudentContentName = () => {
    if (!assessment) return "Student Content";

    switch (assessment.activityType) {
      case "assessment":
        return "Assessment Paper";
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

  const handlePrint = () => {
    const teacherContent = getTeacherContent();
    const printWindow = window.open("", "_blank");
    if (printWindow && teacherContent) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${getTeacherContentName()} - ${assessment.title}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
                line-height: 1.6;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
              }
              th {
                background-color: #f2f2f2;
                font-weight: bold;
              }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${teacherContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Enhanced handleDownload with PDF export using usePdfExport
  const handleDownloadPdf = async () => {
    const teacherContent = getTeacherContent();
    if (!teacherContent) {
      message.error("No content available to download");
      return;
    }

    try {
      // Create a temporary element to render the content for PDF export
      const tempDiv = document.createElement("div");
      tempDiv.id = "temp-rubric-content";
      tempDiv.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #52c41a; margin-bottom: 10px;">${
            assessment.title
          } - ${getTeacherContentName()}</h1>
          <div style="margin-bottom: 15px; color: #666; font-size: 14px;">
            <strong>Subject:</strong> ${assessment.classId?.subject || "N/A"} | 
            <strong>Grade:</strong> ${assessment.classId?.grade || "N/A"} | 
            <strong>Type:</strong> ${assessment.activityType}
          </div>
          <div style="margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 5px;">
            <strong>Instructions:</strong> ${
              assessment.activityType === "assessment"
                ? "Use this answer key to evaluate student responses efficiently."
                : "Use this rubric to evaluate student performance consistently."
            }
          </div>
          <div>${teacherContent}</div>
        </div>
      `;

      // Temporarily add to DOM
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.width =
        assessment.activityType === "assessment" ? "800px" : "1200px"; // Wider for rubrics
      document.body.appendChild(tempDiv);

      // Use the HTML element export method
      const fileName = `${assessment.title.replace(
        /[^a-z0-9]/gi,
        "_"
      )}_${getTeacherContentName().replace(" ", "_")}.pdf`;
      await exportElementToPdf("temp-rubric-content", fileName, {
        format: "a4",
        orientation:
          assessment.activityType === "assessment" ? "portrait" : "landscape",
      });

      // Clean up
      document.body.removeChild(tempDiv);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      message.error("Failed to export to PDF");
    }
  };

  // HTML download as fallback
  const handleDownloadHtml = () => {
    const teacherContent = getTeacherContent();
    if (teacherContent) {
      const blob = new Blob([teacherContent], {
        type: "text/html",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${assessment.title}_${getTeacherContentName().replace(
        " ",
        "_"
      )}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success(`${getTeacherContentName()} downloaded successfully!`);
    }
  };

  const handleViewActivity = () => {
    if (hasStudentContent()) {
      navigate(`/app/assessment/activity/${id}`);
    } else {
      message.warning(
        `No ${getStudentContentName().toLowerCase()} available for this assessment.`
      );
    }
  };

  const handleGoBack = () => {
    navigate("/app/assessment");
  };

  // Download menu items
  const downloadMenuItems = [
    {
      key: "pdf",
      icon: <FilePdfOutlined />,
      label: "Download as PDF",
      onClick: handleDownloadPdf,
      disabled: !getTeacherContent() || isExporting,
    },
    {
      key: "html",
      icon: <FileWordOutlined />,
      label: "Download as HTML",
      onClick: handleDownloadHtml,
      disabled: !getTeacherContent(),
    },
  ];

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
        <Spin
          size="large"
          tip={`Loading ${getTeacherContentName().toLowerCase()}...`}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "24px" }}>
        <Alert
          message={`Error Loading ${getTeacherContentName()}`}
          description={error}
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
      <div style={{ padding: "24px" }}>
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

  const teacherContent = getTeacherContent();

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
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
              {assessment.title} - {getTeacherContentName()}
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
            {hasStudentContent() && (
              <Button
                icon={<EyeOutlined />}
                onClick={handleViewActivity}
                type="default"
              >
                View {getStudentContentName()}
              </Button>
            )}
            <Button
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              type="default"
              disabled={!teacherContent}
            >
              Print
            </Button>
            <Dropdown
              menu={{ items: downloadMenuItems }}
              trigger={["click"]}
              disabled={!teacherContent}
            >
              <Button
                type="primary"
                loading={isExporting}
                disabled={!teacherContent}
              >
                <DownloadOutlined />
                Download
                <CaretDownOutlined />
              </Button>
            </Dropdown>
          </Space>
        </div>
      </Card>

      {/* Teacher Content */}
      <Card title={getTeacherContentName()} style={{ marginBottom: "24px" }}>
        {teacherContent ? (
          <div
            id="rubric-content"
            style={{
              background: "#fff",
              border: "1px solid #f0f0f0",
              borderRadius: "8px",
              overflow: "auto",
            }}
            dangerouslySetInnerHTML={{
              __html: teacherContent,
            }}
          />
        ) : (
          <Alert
            message={`No ${getTeacherContentName()}`}
            description={`No ${getTeacherContentName().toLowerCase()} content has been generated for this assessment.`}
            type="warning"
            showIcon
          />
        )}
      </Card>

      {/* Guidelines */}
      <Card title={`${getTeacherContentName()} Guidelines`} size="small">
        <div style={{ display: "grid", gap: "16px" }}>
          <Alert
            message={`How to Use This ${getTeacherContentName()}`}
            description={
              assessment.activityType === "assessment"
                ? "Use this answer key to evaluate student responses efficiently. Each question includes the correct answer and suggested marking criteria."
                : "Use this rubric to evaluate student performance consistently. Each criterion should be assessed independently, and the total score should reflect the overall quality of the student's work."
            }
            type="info"
            showIcon
          />

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
              <Text type="secondary">{getTeacherContentName()}</Text>
            </div>

            <div>
              <Text strong style={{ display: "block", marginBottom: "4px" }}>
                Assessment Type
              </Text>
              <Text type="secondary">{assessment.assessmentType}</Text>
            </div>

            <div>
              <Text strong style={{ display: "block", marginBottom: "4px" }}>
                Activity Type
              </Text>
              <Text type="secondary">{assessment.activityType}</Text>
            </div>

            <div>
              <Text strong style={{ display: "block", marginBottom: "4px" }}>
                Difficulty Level
              </Text>
              <Text type="secondary">{assessment.difficulty}</Text>
            </div>

            {assessment.duration && (
              <div>
                <Text strong style={{ display: "block", marginBottom: "4px" }}>
                  Suggested Duration
                </Text>
                <Text type="secondary">{assessment.duration}</Text>
              </div>
            )}

            {assessment.questionCount && (
              <div>
                <Text strong style={{ display: "block", marginBottom: "4px" }}>
                  Total Questions
                </Text>
                <Text type="secondary">
                  {assessment.questionCount} questions
                </Text>
              </div>
            )}
          </div>

          {assessment.skills && assessment.skills.length > 0 && (
            <div>
              <Text strong style={{ display: "block", marginBottom: "8px" }}>
                Skills Being Assessed
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

          {assessment.notes && (
            <div>
              <Text strong style={{ display: "block", marginBottom: "8px" }}>
                Additional Notes
              </Text>
              <Text type="secondary">{assessment.notes}</Text>
            </div>
          )}

          <Divider />

          <div>
            <Text strong style={{ display: "block", marginBottom: "8px" }}>
              Assessment Information
            </Text>
            <div style={{ fontSize: "12px", color: "#666" }}>
              <div>
                Created: {new Date(assessment.createdAt).toLocaleDateString()}
              </div>
              <div>
                Last Updated:{" "}
                {new Date(assessment.updatedAt).toLocaleDateString()}
              </div>
              {assessment.usageCount > 0 && (
                <div>Usage Count: {assessment.usageCount} times</div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RubricViewerPage;
