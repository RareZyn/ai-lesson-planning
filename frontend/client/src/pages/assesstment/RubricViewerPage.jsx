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

  // FIXED: Get the appropriate teacher content based on activity type
  const getTeacherContent = () => {
    if (!assessment?.generatedContent) return null;

    const { rubricHTML, answerKeyHTML } = assessment.generatedContent;

    // For assessment type, use answerKeyHTML; for others, use rubricHTML
    if (assessment.activityType === "assessment") {
      return answerKeyHTML;
    } else {
      return rubricHTML;
    }
  };

  // FIXED: Get the appropriate student content
  const getStudentContent = () => {
    if (!assessment?.generatedContent) return null;

    const { activityHTML, assessmentHTML } = assessment.generatedContent;

    // For assessment type, use assessmentHTML; for others, use activityHTML
    if (assessment.activityType === "assessment") {
      return assessmentHTML;
    } else {
      return activityHTML;
    }
  };

  // FIXED: Check if student content exists
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
