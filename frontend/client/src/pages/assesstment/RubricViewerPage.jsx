// src/pages/assessment/RubricViewerPage.jsx
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

const RubricViewerPage = () => {
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

        // Check if rubric HTML exists
        if (!response.data.generatedContent?.rubricHTML) {
          setError("No rubric content found for this assessment.");
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

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow && assessment?.generatedContent?.rubricHTML) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Assessment Rubric - ${assessment.title}</title>
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
            ${assessment.generatedContent.rubricHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    if (assessment?.generatedContent?.rubricHTML) {
      const blob = new Blob([assessment.generatedContent.rubricHTML], {
        type: "text/html",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${assessment.title}_Rubric.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success("Rubric downloaded successfully!");
    }
  };

  const handleViewActivity = () => {
    if (assessment?.hasActivity) {
      navigate(`/app/assessment/activity/${id}`);
    } else {
      message.warning("No activity available for this assessment.");
    }
  };

  const handleGoBack = () => {
    navigate("/app/assessment");
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
        <Spin size="large" tip="Loading assessment rubric..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "24px" }}>
        <Alert
          message="Error Loading Rubric"
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
              {assessment.title} - Rubric
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
            {assessment.hasActivity && (
              <Button
                icon={<EyeOutlined />}
                onClick={handleViewActivity}
                type="default"
              >
                View Activity
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

      {/* Rubric Content */}
      <Card title="Teacher Rubric" style={{ marginBottom: "24px" }}>
        {assessment.generatedContent?.rubricHTML ? (
          <div
            style={{
              background: "#fff",
              border: "1px solid #f0f0f0",
              borderRadius: "8px",
              overflow: "auto",
            }}
            dangerouslySetInnerHTML={{
              __html: assessment.generatedContent.rubricHTML,
            }}
          />
        ) : (
          <Alert
            message="No Rubric Content"
            description="No rubric content has been generated for this assessment."
            type="warning"
            showIcon
          />
        )}
      </Card>

      {/* Grading Guidelines */}
      <Card title="Grading Guidelines" size="small">
        <div style={{ display: "grid", gap: "16px" }}>
          <Alert
            message="How to Use This Rubric"
            description="Use this rubric to evaluate student performance consistently. Each criterion should be assessed independently, and the total score should reflect the overall quality of the student's work."
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
                Assessment Type
              </Text>
              <Text type="secondary">{assessment.assessmentType}</Text>
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
