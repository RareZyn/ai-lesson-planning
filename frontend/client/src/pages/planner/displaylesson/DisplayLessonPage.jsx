import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getLessonPlanById,
  deleteLessonPlan,
} from "../../../services/lessonService";
import { exportToPdf, exportToDocx } from "../../../services/exportService";
import offlineLessonService from "../../../services/offline/offlineLessonService";
import lessonOfflineService from "../../../services/offline/lessonOfflineService";

// Import Ant Design components
import {
  Card,
  Button,
  Tag,
  Descriptions,
  Space,
  Dropdown,
  Alert,
  Row,
  Col,
  Typography,
  Divider,
  Modal,
  Menu,
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
} from "@ant-design/icons";

import styles from "./DisplayLessonPage.module.css";

const { Title, Text, Paragraph } = Typography;



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


  useEffect(() => {
    const fetchLesson = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await getLessonPlanById(id);
        setLessonPlan(data);

        // Auto-save to offline cache for offline editing
        try {
          await lessonOfflineService.saveLessonOffline(data);
        } catch (cacheErr) {
          console.warn("Failed to save to offline cache:", cacheErr);
          // Don't throw - this is just a convenience feature
        }
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
      // Use offline-aware update service
      const result = await offlineLessonService.updateLesson(id, { plan: editedPlan });

      // Update local state with returned data
      setLessonPlan({ ...lessonPlan, plan: result.data.plan || editedPlan });
      setIsEditing(false);
      setEditedPlan(null);

      // Show appropriate message based on whether action was queued
      Modal.success({
        title: 'Success',
        content: result.queued
          ? 'Lesson plan updated offline. Changes will sync when you\'re back online.'
          : 'Lesson plan updated successfully!',
      });
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
        }}
      >
        Export as PDF
      </Menu.Item>
      <Menu.Item
        key="docx"
        icon={<FileWordOutlined />}
        onClick={() => {
          exportToDocx(displayPlan, parameters, lessonDate, lessonPlan.classId);
        }}
      >
        Export as DOCX
      </Menu.Item>
    </Menu>
  );

  return (
    <div
      className="container-fluid py-4"
      style={{ minHeight: "100vh" }}
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
                  <Tag color="blue">
                    {parameters.sow?.focus || parameters.sow?.Focus || "General"}
                  </Tag>
                  {parameters.proficiencyLevel && (
                    <Tag color="green">{parameters.proficiencyLevel}</Tag>
                  )}
                  {parameters.hotsFocus && (
                    <Tag color="purple">
                      {parameters.hotsFocus?.toUpperCase()}
                    </Tag>
                  )}
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
                      menu={{ items: exportMenu }}
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

            {/* Syllabus Content */}
            <Card title="Syllabus Content" className="mb-4">
              {parameters.sow ? (
                <div className={styles.syllabusContainer}>
                  {Object.entries(parameters.sow).map(([key, value]) => {
                    // Filter out internal keys
                    if (["id", "_id", "key", "topicKey"].includes(key)) return null;

                    // Formatter
                    const label = key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())
                      .trim();

                    // Recursive helper
                    const renderSyllabusValue = (val) => {
                      if (Array.isArray(val)) {
                        return (
                          <ul style={{ paddingLeft: "1.2rem", marginBottom: 0, wordBreak: "break-word" }}>
                            {val.map((item, index) => (
                              <li key={index}>{renderSyllabusValue(item)}</li>
                            ))}
                          </ul>
                        );
                      }
                      if (typeof val === "object" && val !== null) {
                        // eslint-disable-next-line
                        return (
                          <div style={{ paddingLeft: "0.5rem", wordBreak: "break-word" }}>
                            {Object.entries(val).map(([subKey, subValue]) => (
                              <div key={subKey}>
                                <Text strong>{subKey}: </Text>
                                {renderSyllabusValue(subValue)}
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return (
                        <Paragraph
                          ellipsis={{ rows: 3, expandable: true, symbol: "more" }}
                          style={{ marginBottom: 0, wordBreak: "break-word", whiteSpace: "pre-wrap" }}
                        >
                          {String(val)}
                        </Paragraph>
                      );
                    };

                    return (
                      <div key={key} className={styles.syllabusRow}>
                        <div className={styles.syllabusLabel}>{label}</div>
                        <div className={styles.syllabusValue}>
                          {renderSyllabusValue(value)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Alert message="No syllabus data attached to this lesson." type="info" />
              )}
            </Card>

            {/* Learning Parameters */}
            <Card title="Learning Parameters" className="mb-4">
              <Descriptions column={1} size="small">
                {parameters.proficiencyLevel && (
                  <Descriptions.Item label="Proficiency Level">
                    <Tag color="green">{parameters.proficiencyLevel}</Tag>
                  </Descriptions.Item>
                )}
                {parameters.hotsFocus && (
                  <Descriptions.Item label="HOTS Focus">
                    <Tag color="purple">
                      {parameters.hotsFocus?.toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                )}
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
