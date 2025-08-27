//ActivityInClassLessonModal.jsx 
import React, { useState, useEffect } from "react";
import {
  Card,
  Radio,
  Button,
  Input,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  Tooltip,
  Select,
  Divider,
  message,
  Alert,
  Spin,
} from "antd";
import {
  ThunderboltOutlined,
  TeamOutlined,
  BookOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import {
  classroomActivityTypes,
  studentArrangementOptions,
  resourceOptions,
  timeDurationOptions,
} from "../../../data/activityTypesInClass";
import "./ModalStyles.css";

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

const ActivityInClassLesson = ({
  isOpen,
  onClose,
  onSubmit,
  selectedLessonPlan,
  activityType = "activity",
  isLessonPlanningMode = false,
  existingConfiguration = null,
  isRegenerateMode = false, // NEW: Flag for regeneration mode
  existingAssessment = null, // NEW: Existing assessment data
}) => {
  const [formData, setFormData] = useState({
    studentArrangement: "small_group",
    resourceUsage: "classroom_only",
    activityType: "",
    duration: "",
    additionalRequirement: "",
  });

  const [loading, setLoading] = useState(false);

  // Load existing configuration if available (for regeneration or lesson planning)
  useEffect(() => {
    if (existingConfiguration) {
      setFormData({
        studentArrangement:
          existingConfiguration.studentArrangement || "small_group",
        resourceUsage: existingConfiguration.resourceUsage || "classroom_only",
        activityType: existingConfiguration.activityType || "",
        duration: existingConfiguration.duration || "",
        additionalRequirement:
          existingConfiguration.additionalRequirement || "",
      });
    }
  }, [existingConfiguration]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.studentArrangement || !formData.resourceUsage) {
      message.warning("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      let submitData;

      if (isLessonPlanningMode) {
        // For lesson planning mode, return configuration data
        submitData = {
          ...formData,
          configuredFor: "activityInClass",
        };

        await onSubmit(submitData);
        message.success("Activity configuration saved successfully!");
      } else if (isRegenerateMode) {
        // NEW: For regeneration mode, submit new configuration
        submitData = {
          ...formData,
          activityType: "activity",
          isRegeneration: true,
          existingAssessmentId: existingAssessment?._id,
        };

        await onSubmit(submitData);
        // Success message will be handled by parent component
      } else {
        // For assessment generation mode (existing functionality)
        submitData = {
          ...formData,
          selectedLessonPlan,
          activityType: "activity",
        };
        await onSubmit(submitData);
        message.success("Activity settings submitted successfully!");
      }

      onClose();
    } catch (error) {
      console.error("Submit error:", error);
      message.error("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      studentArrangement: "small_group",
      resourceUsage: "classroom_only",
      activityType: "",
      duration: "",
      additionalRequirement: "",
    });
  };

  if (!isOpen) return null;

  // Loading overlay when generating/regenerating activity
  if (loading) {
    return (
      <div className="modal-overlay">
        <div
          className="modal-content"
          style={{ maxWidth: "500px", textAlign: "center" }}
        >
          <div style={{ padding: "60px 40px" }}>
            <Spin
              size="large"
              indicator={
                <LoadingOutlined
                  style={{ fontSize: 48, color: "#1890ff" }}
                  spin
                />
              }
            />
            <div style={{ marginTop: "24px" }}>
              <h3 style={{ color: "#1890ff", marginBottom: "8px" }}>
                {isLessonPlanningMode
                  ? "Saving Configuration"
                  : isRegenerateMode
                  ? "Regenerating Activity"
                  : "Generating Activity"}
              </h3>
              <p
                style={{
                  color: "#666",
                  fontSize: "16px",
                  marginBottom: "16px",
                }}
              >
                {isLessonPlanningMode
                  ? "Saving your activity configuration for the lesson plan..."
                  : isRegenerateMode
                  ? "Regenerating your classroom activity with new settings..."
                  : "Creating your classroom activity based on the lesson plan..."}
              </p>
              <div
                style={{
                  background: "#f0f8ff",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #d4edda",
                }}
              >
                <Text type="secondary" style={{ fontSize: "14px" }}>
                  {isLessonPlanningMode
                    ? "Configuring activity parameters"
                    : isRegenerateMode
                    ? "Updating activity with new configuration"
                    : "Setting up interactive learning experience"}
                </Text>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "800px" }}
      >
        {/* Standardized Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon">
              {isRegenerateMode ? <RedoOutlined /> : <ThunderboltOutlined />}
            </div>
            <h3 className="modal-title">
              {isLessonPlanningMode
                ? "Configure Activity in Class"
                : isRegenerateMode
                ? "Regenerate Activity in Class"
                : "Activity in Class"}
            </h3>
          </div>
          <button className="modal-close" onClick={onClose} disabled={loading}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Info Alert based on mode */}
          {isLessonPlanningMode && (
            <Alert
              message="Configure In-Class Activity"
              description="Set up the parameters for your in-class activity. This configuration will be saved with your lesson plan and used when generating assessments later."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          {isRegenerateMode && (
            <Alert
              message="Regenerate Activity Assessment"
              description={`Update the settings for "${selectedLessonPlan?.title}" activity. The existing assessment will be replaced with a new one based on your updated configuration.`}
              type="warning"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          {/* Selected Lesson Plan Info - only show in assessment mode */}
          {!isLessonPlanningMode && selectedLessonPlan && (
            <Alert
              message={`${
                isRegenerateMode ? "Regenerating" : "Based on"
              } Lesson Plan: ${selectedLessonPlan.title || "Selected Lesson"}`}
              description={`${
                isRegenerateMode ? "Update" : "Generate"
              } classroom activity for: ${
                selectedLessonPlan.classId?.className ||
                selectedLessonPlan.class ||
                "Class"
              } | ${
                selectedLessonPlan.parameters?.grade ||
                selectedLessonPlan.grade ||
                "Grade"
              }`}
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          <Row gutter={[16, 24]}>
            {/* Student Arrangement */}
            <Col span={24}>
              <Card
                size="small"
                title={
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <TeamOutlined style={{ color: "#1890ff" }} />
                    <span>Student Arrangement</span>
                  </div>
                }
              >
                <Radio.Group
                  value={formData.studentArrangement}
                  onChange={(e) =>
                    handleInputChange("studentArrangement", e.target.value)
                  }
                  style={{ width: "100%" }}
                  disabled={loading}
                >
                  <Row gutter={[16, 16]}>
                    {studentArrangementOptions.map((option) => (
                      <Col xs={24} sm={12} md={8} key={option.value}>
                        <Radio.Button
                          value={option.value}
                          style={{
                            width: "100%",
                            height: "auto",
                            padding: "12px",
                            textAlign: "left",
                            opacity: loading ? 0.6 : 1,
                          }}
                        >
                          <div>
                            <div
                              style={{ fontSize: "16px", marginBottom: "4px" }}
                            >
                              {option.icon} {option.label}
                            </div>
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              {option.description}
                            </Text>
                          </div>
                        </Radio.Button>
                      </Col>
                    ))}
                  </Row>
                </Radio.Group>
              </Card>
            </Col>

            {/* Resource Usage */}
            <Col span={24}>
              <Card
                size="small"
                title={
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <BookOutlined style={{ color: "#52c41a" }} />
                    <span>Resource Usage</span>
                  </div>
                }
              >
                <Radio.Group
                  value={formData.resourceUsage}
                  onChange={(e) =>
                    handleInputChange("resourceUsage", e.target.value)
                  }
                  style={{ width: "100%" }}
                  disabled={loading}
                >
                  <Row gutter={[16, 16]}>
                    {resourceOptions.map((option) => (
                      <Col xs={24} sm={12} key={option.value}>
                        <Radio.Button
                          value={option.value}
                          style={{
                            width: "100%",
                            height: "auto",
                            padding: "12px",
                            textAlign: "left",
                            opacity: loading ? 0.6 : 1,
                          }}
                        >
                          <div>
                            <div
                              style={{ fontSize: "16px", marginBottom: "4px" }}
                            >
                              {option.icon} {option.label}
                            </div>
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              {option.description}
                            </Text>
                          </div>
                        </Radio.Button>
                      </Col>
                    ))}
                  </Row>
                </Radio.Group>
              </Card>
            </Col>

            {/* Activity Type */}
            <Col span={24}>
              <Card
                size="small"
                title={
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <BulbOutlined style={{ color: "#fa8c16" }} />
                    <span>Activity Type (Optional)</span>
                  </div>
                }
              >
                <Select
                  placeholder="Choose a specific activity type"
                  value={formData.activityType}
                  onChange={(value) => handleInputChange("activityType", value)}
                  style={{ width: "100%" }}
                  size="large"
                  showSearch
                  allowClear
                  disabled={loading}
                  filterOption={(input, option) =>
                    option.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {classroomActivityTypes.map((category) => (
                    <React.Fragment key={category.category}>
                      <Option
                        disabled
                        value={category.category}
                        style={{ fontWeight: "bold", color: "#1890ff" }}
                      >
                        📚 {category.category}
                      </Option>
                      {category.activities.map((activity) => (
                        <Option
                          key={activity}
                          value={activity}
                          style={{ paddingLeft: "20px" }}
                        >
                          {activity}
                        </Option>
                      ))}
                      <Option
                        disabled
                        value={`divider-${category.category}`}
                        style={{ height: "1px", padding: 0 }}
                      >
                        <Divider style={{ margin: 0 }} />
                      </Option>
                    </React.Fragment>
                  ))}
                </Select>
              </Card>
            </Col>

            {/* Duration */}
            <Col span={24}>
              <Card
                size="small"
                title={
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <ClockCircleOutlined style={{ color: "#722ed1" }} />
                    <span>Duration (Optional)</span>
                  </div>
                }
              >
                <Select
                  placeholder="Select duration"
                  value={formData.duration}
                  onChange={(value) => handleInputChange("duration", value)}
                  style={{ width: "100%" }}
                  size="large"
                  allowClear
                  disabled={loading}
                >
                  {timeDurationOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Card>
            </Col>

            {/* Additional Requirements */}
            <Col span={24}>
              <Card
                size="small"
                title="Additional Requirements & Notes (Optional)"
              >
                <TextArea
                  rows={3}
                  value={formData.additionalRequirement}
                  onChange={(e) =>
                    handleInputChange("additionalRequirement", e.target.value)
                  }
                  placeholder={
                    isLessonPlanningMode
                      ? "Enter specific instructions, materials needed, learning objectives, or any special considerations for this activity..."
                      : isRegenerateMode
                      ? "Update instructions, materials, or special considerations for the regenerated activity..."
                      : "Enter specific instructions, materials needed, learning objectives, or any special considerations for this activity based on the selected lesson plan..."
                  }
                  maxLength={300}
                  showCount
                  disabled={loading}
                />
              </Card>
            </Col>

            {/* Summary */}
            <Col span={24}>
              <Card
                size="small"
                title={`Activity ${
                  isRegenerateMode ? "Regeneration" : ""
                } Summary`}
                style={{ background: "#f6ffed", borderColor: "#b7eb8f" }}
              >
                <Row gutter={[16, 8]}>
                  <Col xs={24} sm={12} md={6}>
                    <Text strong style={{ color: "#666" }}>
                      Student Setup:
                    </Text>
                    <br />
                    <Tag color="blue">
                      {formData.studentArrangement.replace("_", " ")}
                    </Tag>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Text strong style={{ color: "#666" }}>
                      Resources:
                    </Text>
                    <br />
                    <Tag color="green">
                      {formData.resourceUsage.replace("_", " ")}
                    </Tag>
                  </Col>
                  {formData.activityType && (
                    <Col xs={24} sm={12} md={6}>
                      <Text strong style={{ color: "#666" }}>
                        Activity:
                      </Text>
                      <br />
                      <Tag color="purple">{formData.activityType}</Tag>
                    </Col>
                  )}
                  {formData.duration && (
                    <Col xs={24} sm={12} md={6}>
                      <Text strong style={{ color: "#666" }}>
                        Duration:
                      </Text>
                      <br />
                      <Tag color="orange">{formData.duration}</Tag>
                    </Col>
                  )}
                  {!isLessonPlanningMode && selectedLessonPlan && (
                    <Col span={24}>
                      <Text strong style={{ color: "#666" }}>
                        {isRegenerateMode ? "Updating" : "Based on"} Lesson:
                      </Text>
                      <br />
                      <Text>{selectedLessonPlan.title}</Text>
                    </Col>
                  )}
                  {isLessonPlanningMode && (
                    <Col span={24}>
                      <Text strong style={{ color: "#666" }}>
                        Configuration Mode:
                      </Text>
                      <br />
                      <Text>
                        This configuration will be saved with your lesson plan
                      </Text>
                    </Col>
                  )}
                  {isRegenerateMode && (
                    <Col span={24}>
                      <Text strong style={{ color: "#666" }}>
                        Regeneration Mode:
                      </Text>
                      <br />
                      <Text type="warning">
                        The existing assessment will be replaced with new
                        content
                      </Text>
                    </Col>
                  )}
                </Row>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Footer Buttons */}
        <div
          className="modal-footer"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <Button onClick={handleReset} disabled={loading}>
            Reset
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
            icon={
              loading ? (
                <LoadingOutlined />
              ) : isRegenerateMode ? (
                <RedoOutlined />
              ) : null
            }
          >
            {loading
              ? isLessonPlanningMode
                ? "Saving..."
                : isRegenerateMode
                ? "Regenerating..."
                : "Generating..."
              : isLessonPlanningMode
              ? "Save Configuration"
              : isRegenerateMode
              ? "Regenerate Activity"
              : "Submit Activity"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActivityInClassLesson;
