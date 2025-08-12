import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getLessonPlanById,
  deleteLessonPlan,
  updateLessonPlan,
} from "../../../services/lessonService";
import { exportToPdf, exportToDocx } from "../../../services/exportService";

// Import Ant Design components
import {
  Card,
  Button,
  Tag,
  Descriptions,
  Space,
  Dropdown,
  Menu,
  Alert,
  Row,
  Col,
  Typography,
  Divider,
} from "antd";

// Import Ant Design icons
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  SettingOutlined,
  BookOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  CalendarOutlined,
  SchoolOutlined,
} from "@ant-design/icons";

import styles from "./DisplayLessonPage.module.css";

const { Title, Text, Paragraph } = Typography;

// A recursive component to display the parameters object cleanly.
const renderParameters = (obj) => {
  const formatKey = (key) => {
    const result = key.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  return (
    <ul className={styles.paramSubList}>
      {Object.entries(obj).map(([key, value]) => {
        if (key === "_id" || key === "__v" || key === "activityConfiguration")
          return null;

        const formattedKey = formatKey(key);

        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          return (
            <li key={key} className={styles.paramNestedObject}>
              <strong>{formattedKey}:</strong>
              {renderParameters(value)}
            </li>
          );
        }
        return (
          <li key={key}>
            <strong>{formattedKey}:</strong>{" "}
            {Array.isArray(value) ? value.join(", ") : String(value)}
          </li>
        );
      })}
    </ul>
  );
};

const DisplayLessonPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lessonPlan, setLessonPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await getLessonPlanById(id);
        setLessonPlan(data);
        console.log("Lesson plan loaded:", data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLesson();
  }, [id]);

  // Helper functions for activity configuration
  const getActivityTypeLabel = (type) => {
    const labels = {
      textbook: "Textbook-based Activity",
      essay: "Essay Writing",
      activityInClass: "In-class Activity",
      assessment: "Assessment / Test",
    };
    return labels[type] || type;
  };

  const getActivityTypeIcon = (type) => {
    const icons = {
      textbook: <BookOutlined style={{ color: "#52c41a" }} />,
      essay: <EditOutlined style={{ color: "#1890ff" }} />,
      activityInClass: <ThunderboltOutlined style={{ color: "#fa8c16" }} />,
      assessment: <FileTextOutlined style={{ color: "#722ed1" }} />,
    };
    return icons[type] || <SettingOutlined />;
  };

  const getActivityTypeColor = (type) => {
    const colors = {
      textbook: "success",
      essay: "processing",
      activityInClass: "warning",
      assessment: "purple",
    };
    return colors[type] || "default";
  };

  const getConfigurationSummary = (activityConfiguration) => {
    if (!activityConfiguration?.parameters)
      return "No configuration details available";

    const params = activityConfiguration.parameters;
    const type = activityConfiguration.type;

    switch (type) {
      case "essay":
        return `${params.essayType || "Standard"} essay, ${
          params.wordCount || "unspecified"
        } words`;
      case "assessment":
        return `${params.assessmentType || "Standard"} assessment with ${
          params.numberOfQuestions || "unspecified"
        } questions`;
      case "activityInClass":
        return `${params.activityType || "General"} activity with ${
          params.studentArrangement || "flexible"
        } arrangement`;
      case "textbook":
        return "Textbook-based activity with standard requirements";
      default:
        return "Configured activity parameters";
    }
  };

  const renderActivityConfiguration = () => {
    const activityConfiguration =
      lessonPlan?.activityConfiguration ||
      lessonPlan?.parameters?.activityConfiguration;
    const activityType =
      lessonPlan?.activityType || lessonPlan?.parameters?.activityType;

    if (!activityConfiguration?.parameters) return null;

    const params = activityConfiguration.parameters;
    const type = activityConfiguration.type || activityType;

    const getConfigurationItems = () => {
      switch (type) {
        case "essay":
          return [
            { label: "Essay Type", value: params.essayType || "Not specified" },
            { label: "Word Count", value: params.wordCount || "Not specified" },
            { label: "Duration", value: params.duration || "Not specified" },
            {
              label: "Additional Requirements",
              value: params.additionalRequirement || "None",
            },
          ];

        case "assessment":
          return [
            {
              label: "Assessment Type",
              value: params.assessmentType || "Not specified",
            },
            {
              label: "Number of Questions",
              value: params.numberOfQuestions || "Not specified",
            },
            {
              label: "Time Allocation",
              value: `${params.timeAllocation || "Unknown"} minutes`,
            },
            {
              label: "Question Types",
              value: Array.isArray(params.questionTypes)
                ? params.questionTypes.join(", ")
                : "Not specified",
            },
            {
              label: "Additional Requirements",
              value: params.additionalRequirement || "None",
            },
          ];

        case "activityInClass":
          return [
            {
              label: "Student Arrangement",
              value:
                params.studentArrangement?.replace("_", " ") || "Not specified",
            },
            {
              label: "Resource Usage",
              value: params.resourceUsage?.replace("_", " ") || "Not specified",
            },
            {
              label: "Activity Type",
              value: params.activityType || "Not specified",
            },
            { label: "Duration", value: params.duration || "Not specified" },
            {
              label: "Additional Requirements",
              value: params.additionalRequirement || "None",
            },
          ];

        case "textbook":
          return [
            {
              label: "Activity Requirements",
              value:
                params.additionalRequirement || "Standard textbook activity",
            },
          ];

        default:
          return [{ label: "Configuration", value: "Available" }];
      }
    };

    const configItems = getConfigurationItems();

    return (
      <Card
        className="mb-4"
        style={{ borderColor: "#52c41a" }}
        title={
          <Space>
            {getActivityTypeIcon(type)}
            <span>Activity Configuration</span>
            <Tag color={getActivityTypeColor(type)}>
              {getActivityTypeLabel(type)}
            </Tag>
          </Space>
        }
        extra={
          <Tag color="green" icon={<SettingOutlined />}>
            Configured
          </Tag>
        }
      >
        <Alert
          message="Assessment Ready"
          description="This lesson plan has been configured with specific activity parameters. These settings will be automatically applied when creating assessments from this lesson plan."
          type="success"
          showIcon
          className="mb-3"
        />

        <Descriptions
          bordered
          size="small"
          column={{ xs: 1, sm: 1, md: 2, lg: 2 }}
        >
          {configItems.map((item, index) => (
            <Descriptions.Item
              key={index}
              label={<Text strong>{item.label}</Text>}
            >
              <Text>{item.value}</Text>
            </Descriptions.Item>
          ))}
          <Descriptions.Item label={<Text strong>Configured Date</Text>}>
            <Text type="secondary">
              {activityConfiguration.configuredAt
                ? new Date(
                    activityConfiguration.configuredAt
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Unknown date"}
            </Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    );
  };

  // Action Handlers
  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to permanently delete this lesson plan?"
      )
    ) {
      try {
        await deleteLessonPlan(id);
        alert("Lesson plan deleted successfully.");
        navigate("/app/lessons");
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleEdit = () => {
    setEditedPlan(JSON.parse(JSON.stringify(lessonPlan.plan)));
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedPlan(null);
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const updatedData = await updateLessonPlan(id, editedPlan);
      setLessonPlan(updatedData);
      setIsEditing(false);
      setEditedPlan(null);
      alert("Lesson plan updated successfully!");
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlanChange = (section, value) => {
    setEditedPlan((prev) => ({ ...prev, [section]: value }));
  };

  const handleArrayChange = (section, value) => {
    setEditedPlan((prev) => ({ ...prev, [section]: value.split("\n") }));
  };

  const handleActivityChange = (stage, value) => {
    const updatedActivities = {
      ...editedPlan.activities,
      [stage]: value.split("\n"),
    };
    handlePlanChange("activities", updatedActivities);
  };

  // Render Logic
  if (isLoading)
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "60vh" }}
      >
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <Text type="secondary">Loading lesson plan...</Text>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="container mt-4">
        <Alert
          message="Error Loading Lesson Plan"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        />
      </div>
    );

  if (!lessonPlan)
    return (
      <div className="container mt-4">
        <Alert
          message="Lesson Plan Not Found"
          description="The requested lesson plan could not be found."
          type="warning"
          showIcon
        />
      </div>
    );

  const { parameters, lessonDate } = lessonPlan;
  const displayPlan = isEditing ? editedPlan : lessonPlan.plan;

  // Get activity configuration from lesson plan or parameters
  const activityConfiguration =
    lessonPlan.activityConfiguration || parameters?.activityConfiguration;
  const activityType = lessonPlan.activityType || parameters?.activityType;

  // Export menu for dropdown
  const exportMenu = (
    <Menu>
      <Menu.Item
        key="pdf"
        icon={<FilePdfOutlined />}
        onClick={() => {
          exportToPdf(displayPlan, parameters, lessonDate, lessonPlan.classId);
          setShowExportOptions(false);
        }}
      >
        Export as PDF
      </Menu.Item>
      <Menu.Item
        key="docx"
        icon={<FileWordOutlined />}
        onClick={() => {
          exportToDocx(displayPlan, parameters, lessonDate, lessonPlan.classId);
          setShowExportOptions(false);
        }}
      >
        Export as DOCX
      </Menu.Item>
    </Menu>
  );

  return (
    <div
      className="container-fluid py-4"
      style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}
    >
      <div className="container">
        {/* Back Button */}
        <div className="mb-3">
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/app/lessons")}
            className="p-0"
          >
            Back to All Lessons
          </Button>
        </div>

        {/* Header */}
        <Card className="mb-4" style={{ borderRadius: "12px" }}>
          <Row justify="space-between" align="middle">
            <Col xs={24} lg={16}>
              <Title level={2} className="mb-1">
                {parameters.specificTopic}
              </Title>
              <Text type="secondary" className="fs-5">
                {lessonPlan.classId?.className || "N/A"}
              </Text>
              <div className="mt-2">
                <Space wrap>
                  <Tag color="blue">{parameters.sow?.focus || "General"}</Tag>
                  <Tag color="green">{parameters.proficiencyLevel}</Tag>
                  <Tag color="purple">
                    {parameters.hotsFocus?.toUpperCase()}
                  </Tag>
                  {activityType && (
                    <Tag color={getActivityTypeColor(activityType)}>
                      {getActivityTypeLabel(activityType)}
                    </Tag>
                  )}
                </Space>
              </div>
            </Col>
            <Col xs={24} lg={8}>
              <div className="d-flex justify-content-end gap-2 mt-3 mt-lg-0">
                {isEditing ? (
                  <Space>
                    <Button
                      icon={<CloseOutlined />}
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={handleSaveEdit}
                      loading={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </Space>
                ) : (
                  <Space>
                    <Dropdown
                      overlay={exportMenu}
                      trigger={["click"]}
                      placement="bottomRight"
                    >
                      <Button icon={<DownloadOutlined />}>Export</Button>
                    </Dropdown>
                    <Button icon={<EditOutlined />} onClick={handleEdit}>
                      Edit
                    </Button>
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={handleDelete}
                    >
                      Delete
                    </Button>
                  </Space>
                )}
              </div>
            </Col>
          </Row>
        </Card>

        <Row gutter={[24, 24]}>
          <Col xs={24} xl={16}>
            {/* Activity Configuration Section */}
            {activityConfiguration && renderActivityConfiguration()}

            {/* Learning Objective */}
            <Card title="Learning Objective" className="mb-4">
              {isEditing ? (
                <textarea
                  className="form-control"
                  rows="3"
                  value={displayPlan.learningObjective}
                  onChange={(e) =>
                    handlePlanChange("learningObjective", e.target.value)
                  }
                />
              ) : (
                <Paragraph className="mb-0">
                  {displayPlan.learningObjective}
                </Paragraph>
              )}
            </Card>

            {/* Success Criteria */}
            <Card title="Success Criteria" className="mb-4">
              {isEditing ? (
                <textarea
                  className="form-control"
                  rows="5"
                  placeholder="One criterion per line..."
                  value={displayPlan.successCriteria.join("\n")}
                  onChange={(e) =>
                    handleArrayChange("successCriteria", e.target.value)
                  }
                />
              ) : (
                <ul className="mb-0">
                  {displayPlan.successCriteria.map((item, i) => (
                    <li key={i} className="mb-1">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Activities */}
            <Card title="Lesson Activities" className="mb-4">
              {/* Pre-Lesson */}
              <div className="mb-4">
                <Title level={5} className="text-primary mb-2">
                  <BulbOutlined className="me-2" />
                  Pre-Lesson / Set Induction
                </Title>
                {isEditing ? (
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="One activity per line..."
                    value={displayPlan.activities.preLesson.join("\n")}
                    onChange={(e) =>
                      handleActivityChange("preLesson", e.target.value)
                    }
                  />
                ) : (
                  <ul className="mb-0">
                    {displayPlan.activities.preLesson.map((item, i) => (
                      <li key={i} className="mb-1">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Divider />

              {/* During-Lesson */}
              <div className="mb-4">
                <Title level={5} className="text-success mb-2">
                  <ThunderboltOutlined className="me-2" />
                  During Lesson / Main Activities
                </Title>
                {isEditing ? (
                  <textarea
                    className="form-control"
                    rows="8"
                    placeholder="One activity per line..."
                    value={displayPlan.activities.duringLesson.join("\n")}
                    onChange={(e) =>
                      handleActivityChange("duringLesson", e.target.value)
                    }
                  />
                ) : (
                  <ul className="mb-0">
                    {displayPlan.activities.duringLesson.map((item, i) => (
                      <li key={i} className="mb-1">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Divider />

              {/* Post-Lesson */}
              <div>
                <Title level={5} className="text-warning mb-2">
                  <BookOutlined className="me-2" />
                  Post-Lesson / Closure
                </Title>
                {isEditing ? (
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="One activity per line..."
                    value={displayPlan.activities.postLesson.join("\n")}
                    onChange={(e) =>
                      handleActivityChange("postLesson", e.target.value)
                    }
                  />
                ) : (
                  <ul className="mb-0">
                    {displayPlan.activities.postLesson.map((item, i) => (
                      <li key={i} className="mb-1">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </Col>

          <Col xs={24} xl={8}>
            {/* Lesson Details */}
            <Card title="Lesson Details" className="mb-4">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Class">
                  <Text strong>{lessonPlan.classId?.className || "N/A"}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Date">
                  <Text>
                    {new Date(lessonDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Subject">
                  <Text>
                    {lessonPlan.classId?.subject || parameters.subject || "N/A"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Grade">
                  <Text>
                    {lessonPlan.classId?.grade || parameters.grade || "N/A"}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Scheme of Work */}
            <Card title="Scheme of Work" className="mb-4">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Lesson Number">
                  <Text strong>Lesson {parameters.sow?.lessonNo}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Topic">
                  <Text>{parameters.sow?.topic}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Focus">
                  <Tag color="blue">{parameters.sow?.focus}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Theme">
                  <Text type="secondary">{parameters.sow?.theme}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Learning Parameters */}
            <Card title="Learning Parameters" className="mb-4">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Proficiency Level">
                  <Tag color="green">{parameters.proficiencyLevel}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="HOTS Focus">
                  <Tag color="purple">
                    {parameters.hotsFocus?.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                {activityType && (
                  <Descriptions.Item label="Activity Type">
                    <Tag color={getActivityTypeColor(activityType)}>
                      {getActivityTypeLabel(activityType)}
                    </Tag>
                  </Descriptions.Item>
                )}
                {parameters.additionalNotes && (
                  <Descriptions.Item label="Additional Notes">
                    <Text type="secondary" style={{ fontSize: "13px" }}>
                      {parameters.additionalNotes}
                    </Text>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* Activity Configuration Summary */}
            {activityConfiguration && (
              <Card
                title={
                  <Space>
                    {getActivityTypeIcon(activityType)}
                    <span>Quick Config Summary</span>
                  </Space>
                }
                className="mb-4"
                size="small"
              >
                <Alert
                  message="Assessment Ready"
                  description="Activity parameters are configured and ready for assessment creation."
                  type="success"
                  showIcon
                  className="mb-3"
                />
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Configured:{" "}
                  {activityConfiguration.configuredAt
                    ? new Date(
                        activityConfiguration.configuredAt
                      ).toLocaleDateString()
                    : "Unknown date"}
                </Text>
              </Card>
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default DisplayLessonPage;
