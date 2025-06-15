// Updated src/pages/assessment/ActivityViewerPage.jsx - Added PDF export functionality
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

const ActivityViewerPage = () => {
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


        // Enhanced content validation with detailed logging
        const { activityHTML, assessmentHTML, rubricHTML, answerKeyHTML } =
          response.data.generatedContent || {};

        console.log("Content availability:", {
          activityHTML: !!activityHTML,
          assessmentHTML: !!assessmentHTML,
          rubricHTML: !!rubricHTML,
          answerKeyHTML: !!answerKeyHTML,
          activityType: response.data.activityType,
        });

        // Check for student content based on activity type
        const hasStudentContent = getStudentContentFromData(response.data);

        if (!hasStudentContent) {
          console.warn(
            "No student content found for activity type:",
            response.data.activityType
          );
          setError("No student content found for this assessment.");
        }
      } else {
        console.error("API response unsuccessful or no data:", response);
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

  // Helper function to check content availability from raw data
  const getStudentContentFromData = (assessmentData) => {
    if (!assessmentData?.generatedContent) return null;

    const { activityHTML, assessmentHTML } = assessmentData.generatedContent;

    // For assessment type, use assessmentHTML; for others, use activityHTML
    if (assessmentData.activityType === "assessment") {
      return assessmentHTML;
    } else {
      return activityHTML;
    }
  };

  // Get the appropriate content based on activity type
  const getStudentContent = () => {
    if (!assessment?.generatedContent) {
      console.log("No generated content available");
      return null;
    }

    const { activityHTML, assessmentHTML } = assessment.generatedContent;

    // Enhanced logging
    console.log(
      "Getting student content for activityType:",
      assessment.activityType
    );
    console.log("Available content:", {
      activityHTML: activityHTML ? "Present" : "Missing",
      assessmentHTML: assessmentHTML ? "Present" : "Missing",
    });

    // For assessment type, use assessmentHTML; for others, use activityHTML
    if (assessment.activityType === "assessment") {
      const content = assessmentHTML;
      console.log("Returning assessmentHTML for assessment type:", !!content);
      return content;
    } else {
      const content = activityHTML;
      console.log("Returning activityHTML for non-assessment type:", !!content);
      return content;
    }
  };

  // Get the appropriate teacher content
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

  // Check if teacher content exists
  const hasTeacherContent = () => {
    const teacherContent = getTeacherContent();
    const hasContent = !!teacherContent;
    console.log("Has teacher content:", hasContent);
    return hasContent;
  };

  const handlePrint = () => {
    const studentContent = getStudentContent();
    if (!studentContent) {
      message.error("No content available to print");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (printWindow && studentContent) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Assessment - ${assessment.title}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
                line-height: 1.6;
              }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${studentContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Enhanced handleDownload with PDF export using usePdfExport
  const handleDownloadPdf = async () => {
    const studentContent = getStudentContent();
    if (!studentContent) {
      message.error("No content available to download");
      return;
    }

    try {
      // Create a temporary element to render the content for PDF export
      const tempDiv = document.createElement("div");
      tempDiv.id = "temp-activity-content";
      tempDiv.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #1890ff; margin-bottom: 10px;">${
            assessment.title
          }</h1>
          <div style="margin-bottom: 15px; color: #666; font-size: 14px;">
            <strong>Subject:</strong> ${assessment.classId?.subject || "N/A"} | 
            <strong>Grade:</strong> ${assessment.classId?.grade || "N/A"} | 
            <strong>Duration:</strong> ${assessment.duration || "N/A"}
          </div>
          <div style="margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 5px;">
            <strong>Instructions:</strong> ${
              assessment.description || "Complete the following assessment."
            }
          </div>
          <div>${studentContent}</div>
        </div>
      `;

      // Temporarily add to DOM
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.width = "800px";
      document.body.appendChild(tempDiv);

      // Use the HTML element export method
      const fileName = `${assessment.title.replace(
        /[^a-z0-9]/gi,
        "_"
      )}_Activity.pdf`;
      await exportElementToPdf("temp-activity-content", fileName, {
        format: "a4",
        orientation: "portrait",
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
    const studentContent = getStudentContent();
    if (!studentContent) {
      message.error("No content available to download");
      return;
    }

    const blob = new Blob([studentContent], {
      type: "text/html",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${assessment.title}_${
      assessment.activityType === "assessment" ? "Assessment" : "Activity"
    }.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success(
      `${
        assessment.activityType === "assessment" ? "Assessment" : "Activity"
      } downloaded successfully!`
    );
  };

  const handleViewRubric = () => {
    if (hasTeacherContent()) {
      navigate(`/app/assessment/rubric/${id}`);
    } else {
      message.warning(
        `No ${
          assessment.activityType === "assessment" ? "answer key" : "rubric"
        } available for this assessment.`
      );
    }
  };

  const handleGoBack = () => {
    navigate("/app/assessment");
  };

  // Get appropriate content type name
  const getContentTypeName = () => {
    if (!assessment) return "Content";

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

  // Get appropriate teacher content name
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

  // Download menu items
  const downloadMenuItems = [
    {
      key: "pdf",
      icon: <FilePdfOutlined />,
      label: "Download as PDF",
      onClick: handleDownloadPdf,
      disabled: !getStudentContent() || isExporting,
    },
    {
      key: "html",
      icon: <FileWordOutlined />,
      label: "Download as HTML",
      onClick: handleDownloadHtml,
      disabled: !getStudentContent(),
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
        <Spin size="large" tip="Loading assessment content..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "24px" }}>
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

  const studentContent = getStudentContent();

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
            {hasTeacherContent() && (
              <Button
                icon={<EyeOutlined />}
                onClick={handleViewRubric}
                type="default"
              >
                View {getTeacherContentName()}
              </Button>
            )}
            <Button
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              type="default"
              disabled={!studentContent}
            >
              Print
            </Button>
            <Dropdown
              menu={{ items: downloadMenuItems }}
              trigger={["click"]}
              disabled={!studentContent}
            >
              <Button
                type="primary"
                loading={isExporting}
                disabled={!studentContent}
              >
                <DownloadOutlined />
                Download
                <CaretDownOutlined />
              </Button>
            </Dropdown>
          </Space>
        </div>
      </Card>

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
                  {assessment.activityType === "assessment"
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
                  {assessment.activityType === "assessment"
                    ? "assessmentHTML"
                    : "activityHTML"}
                  <br />
                  Content Available:{" "}
                  {JSON.stringify({
                    activityHTML: !!assessment.generatedContent?.activityHTML,
                    assessmentHTML:
                      !!assessment.generatedContent?.assessmentHTML,
                  })}
                </div>
              </div>
            }
            type="warning"
            showIcon
          />
        )}
      </Card>

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
    </div>
  );
};

export default ActivityViewerPage;
