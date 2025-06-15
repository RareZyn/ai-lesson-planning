// Fixed src/pages/assessment/ActivityViewerPage.jsx - Handle different content types
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
} from "antd";
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { assessmentAPI } from "../../services/assessmentService";

const { Title, Text } = Typography;

const ActivityViewerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssessment();
  }, [id]);

  const fetchAssessment = async () => {
    try {
      setLoading(true);
      const response = await assessmentAPI.getAssessmentById(id);

      if (response.success && response.data) {
        setAssessment(response.data);

        // FIXED: Check for both activityHTML and assessmentHTML
        const hasStudentContent = !!(
          response.data.generatedContent?.activityHTML ||
          response.data.generatedContent?.assessmentHTML
        );

        if (!hasStudentContent) {
          setError("No student content found for this assessment.");
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

  // FIXED: Get the appropriate content based on activity type
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

  // FIXED: Get the appropriate teacher content
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

  // FIXED: Check if teacher content exists
  const hasTeacherContent = () => {
    return !!getTeacherContent();
  };

  const handlePrint = () => {
    const studentContent = getStudentContent();
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

  const handleDownload = () => {
    const studentContent = getStudentContent();
    if (studentContent) {
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
    }
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

  // FIXED: Get appropriate content type name
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

  // FIXED: Get appropriate teacher content name
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
            >
              Print
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              type="primary"
            >
              Download
            </Button>
          </Space>
        </div>
      </Card>

      {/* Student Content */}
      <Card title={getContentTypeName()} style={{ marginBottom: "24px" }}>
        {studentContent ? (
          <div
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
            description={`No ${
              assessment.activityType === "assessment"
                ? "assessment"
                : "activity"
            } content has been generated for this assessment.`}
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
