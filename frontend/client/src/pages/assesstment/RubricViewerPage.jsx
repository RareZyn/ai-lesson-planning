//src/pages/assessment/RubricViewerPage.jsx
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

  // Add marking scheme if available
  if (answerKeyContent.markingScheme) {
    html += `<div class="marking-scheme" style="margin-top: 25px; padding: 15px; background: #e6f7ff; border-radius: 8px;">
      <h3 style="color: #1890ff; margin-bottom: 15px;">Marking Scheme:</h3>`;

    Object.entries(answerKeyContent.markingScheme).forEach(
      ([section, description]) => {
        html += `<p><strong>${
          section.charAt(0).toUpperCase() + section.slice(1)
        }:</strong> ${description}</p>`;
      }
    );

    html += `</div>`;
  }

  // Add grading scale if available
  if (answerKeyContent.gradingScale) {
    html += `<div class="grading-scale" style="margin-top: 25px; padding: 15px; background: #fff7e6; border-radius: 8px;">
      <h3 style="color: #fa8c16; margin-bottom: 15px;">Grading Scale:</h3>
      <ul style="margin: 0; padding-left: 20px;">`;

    Object.entries(answerKeyContent.gradingScale).forEach(([level, range]) => {
      html += `<li><strong>${level.toUpperCase()}:</strong> ${range}</li>`;
    });

    html += `</ul></div>`;
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

        // FIXED: Enhanced check for both rubricHTML and answerKeyHTML for SPM exams
        const hasTeacherContent = !!(
          response.data.generatedContent?.rubricHTML ||
          response.data.generatedContent?.answerKeyHTML ||
          response.data.generatedContent?.rubricContent ||
          response.data.generatedContent?.answerKeyContent
        );

        console.log(
          "🔍 Teacher content detection for",
          response.data.activityType,
          {
            rubricHTML: !!response.data.generatedContent?.rubricHTML,
            answerKeyHTML: !!response.data.generatedContent?.answerKeyHTML,
            rubricContent: !!response.data.generatedContent?.rubricContent,
            answerKeyContent:
              !!response.data.generatedContent?.answerKeyContent,
            hasTeacherContent,
          }
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

  // FIXED: Enhanced getTeacherContent function with proper SPM exam support
  const getTeacherContent = () => {
    if (!assessment?.generatedContent) return null;

    const { rubricHTML, answerKeyHTML, rubricContent, answerKeyContent } =
      assessment.generatedContent;

    console.log("🎯 Getting teacher content for", assessment.activityType, {
      rubricHTML: !!rubricHTML,
      answerKeyHTML: !!answerKeyHTML,
      rubricContent: !!rubricContent,
      answerKeyContent: !!answerKeyContent,
    });

    // CRITICAL: Handle SPM exam and assessment types - they should use answer key content
    if (
      assessment.activityType === "spm-exam" ||
      assessment.activityType === "assessment"
    ) {
      if (answerKeyHTML) {
        console.log("✅ Using answerKeyHTML for", assessment.activityType);
        return answerKeyHTML;
      } else if (answerKeyContent) {
        console.log(
          "✅ Converting answerKeyContent to HTML for",
          assessment.activityType
        );
        return convertAnswerKeyContentToHTML(answerKeyContent);
      }
    } else {
      // For other types (essay, textbook, activity), use rubric content
      if (rubricHTML) {
        console.log("✅ Using rubricHTML for", assessment.activityType);
        return rubricHTML;
      } else if (rubricContent) {
        console.log(
          "✅ Converting rubricContent to HTML for",
          assessment.activityType
        );
        return convertRubricContentToHTML(rubricContent);
      }
    }

    console.log("❌ No teacher content found for", assessment.activityType);
    return null;
  };

  // Enhanced getStudentContent function (for completeness)
  const getStudentContent = () => {
    if (!assessment?.generatedContent) return null;

    const { activityHTML, assessmentHTML, examHTML } =
      assessment.generatedContent;

    // CRITICAL: Handle SPM exam content correctly
    if (assessment.activityType === "smp-exam") {
      return examHTML || assessmentHTML;
    } else if (assessment.activityType === "assessment") {
      return assessmentHTML;
    } else {
      return activityHTML;
    }
  };

  const hasStudentContent = () => {
    return !!getStudentContent();
  };

  // FIXED: Get appropriate content type names with SPM exam support
  const getTeacherContentName = () => {
    if (!assessment) return "Teacher Content";

    switch (assessment.activityType) {
      case "assessment":
      case "spm-exam": // CRITICAL: SPM exams use answer keys
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
      case "smp-exam": // CRITICAL: Handle SPM exam naming
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

  const handlePrint = () => {
    const teacherContent = getTeacherContent();
    if (!teacherContent) {
      message.error("No content available to print");
      return;
    }

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
              assessment.activityType === "assessment" ||
              assessment.activityType === "smp-exam"
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
        assessment.activityType === "assessment" ||
        assessment.activityType === "smp-exam"
          ? "800px"
          : "1200px"; // Wider for rubrics
      document.body.appendChild(tempDiv);

      // Use the HTML element export method
      const fileName = `${assessment.title.replace(
        /[^a-z0-9]/gi,
        "_"
      )}_${getTeacherContentName().replace(" ", "_")}.pdf`;
      await exportElementToPdf("temp-rubric-content", fileName, {
        format: "a4",
        orientation:
          assessment.activityType === "assessment" ||
          assessment.activityType === "smp-exam"
            ? "portrait"
            : "landscape",
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
      navigate(`/app/assessment/${id}`);
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
          description={
            <div>
              <div>{error}</div>
              {assessment && (
                <div style={{ marginTop: "8px", fontSize: "12px" }}>
                  <strong>Debug Info:</strong>
                  <br />
                  Activity Type: {assessment.activityType}
                  <br />
                  Teacher Content Available:{" "}
                  {JSON.stringify({
                    rubricHTML: !!assessment.generatedContent?.rubricHTML,
                    answerKeyHTML: !!assessment.generatedContent?.answerKeyHTML,
                    rubricContent: !!assessment.generatedContent?.rubricContent,
                    answerKeyContent:
                      !!assessment.generatedContent?.answerKeyContent,
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
            description={
              <div>
                <div>
                  No {getTeacherContentName().toLowerCase()} content has been
                  generated for this assessment.
                </div>
                {assessment && (
                  <div style={{ marginTop: "8px", fontSize: "12px" }}>
                    <strong>Debug Info:</strong>
                    <br />
                    Activity Type: {assessment.activityType}
                    <br />
                    Expected Content:{" "}
                    {assessment.activityType === "smp-exam" ||
                    assessment.activityType === "assessment"
                      ? "answerKeyHTML or answerKeyContent"
                      : "rubricHTML or rubricContent"}
                    <br />
                    Content Available:{" "}
                    {JSON.stringify({
                      rubricHTML: !!assessment.generatedContent?.rubricHTML,
                      answerKeyHTML:
                        !!assessment.generatedContent?.answerKeyHTML,
                      rubricContent:
                        !!assessment.generatedContent?.rubricContent,
                      answerKeyContent:
                        !!assessment.generatedContent?.answerKeyContent,
                    })}
                  </div>
                )}
              </div>
            }
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
              assessment.activityType === "assessment" ||
              assessment.activityType === "smp-exam"
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

          {/* SPM Exam Configuration Display */}
          {assessment.activityType === "smp-exam" &&
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
