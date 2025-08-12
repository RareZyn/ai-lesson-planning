//Updated EssayLessonModal.jsx with lesson planning mode support
import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Input,
  Row,
  Col,
  Typography,
  Tag,
  Select,
  message,
  Alert,
  Spin,
} from "antd";
import {
  EditOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import "./ModalStyles.css";

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

const EssayLesson = ({
  isOpen,
  onClose,
  onSubmit,
  selectedLessonPlan,
  activityType = "essay",
  isLessonPlanningMode = false, // NEW: Flag to indicate lesson planning mode
  existingConfiguration = null, // NEW: Existing configuration data
}) => {
  const [formData, setFormData] = useState({
    essayType: "descriptive",
    wordCount: "200-300 words",
    duration: "60 minutes",
    additionalRequirement: "",
  });

  const [loading, setLoading] = useState(false);

  const essayTypes = [
    { value: "descriptive", label: "Descriptive Essay" },
    { value: "narrative", label: "Narrative Essay" },
    { value: "expository", label: "Expository Essay" },
    { value: "persuasive", label: "Persuasive Essay" },
    { value: "argumentative", label: "Argumentative Essay" },
    { value: "compare_contrast", label: "Compare & Contrast Essay" },
  ];

  const wordCountOptions = [
    { value: "150-200 words", label: "150-200 words" },
    { value: "200-300 words", label: "200-300 words" },
    { value: "300-400 words", label: "300-400 words" },
    { value: "400-500 words", label: "400-500 words" },
    { value: "500+ words", label: "500+ words" },
  ];

  const durationOptions = [
    { value: "45 minutes", label: "45 minutes" },
    { value: "60 minutes", label: "60 minutes" },
    { value: "90 minutes", label: "90 minutes" },
    { value: "120 minutes", label: "120 minutes" },
  ];

  // Load existing configuration if available
  useEffect(() => {
    if (existingConfiguration) {
      setFormData({
        essayType: existingConfiguration.essayType || "descriptive",
        wordCount: existingConfiguration.wordCount || "200-300 words",
        duration: existingConfiguration.duration || "60 minutes",
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
    if (!formData.essayType) {
      message.warning("Please select an essay type");
      return;
    }

    setLoading(true);
    try {
      let submitData;

      if (isLessonPlanningMode) {
        // For lesson planning mode, return configuration data
        submitData = {
          ...formData,
          configuredFor: "essay", // Identifier for the configuration type
        };

        await onSubmit(submitData);
        message.success("Essay configuration saved successfully!");
      } else {
        // For assessment generation mode (existing functionality)
        submitData = {
          ...formData,
          selectedLessonPlan,
          activityType,
        };
        await onSubmit(submitData);
        message.success("Essay settings submitted successfully!");
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
      essayType: "descriptive",
      wordCount: "200-300 words",
      duration: "60 minutes",
      additionalRequirement: "",
    });
  };

  if (!isOpen) return null;

  // Loading overlay when generating essay assessment
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
                  : "Generating Essay Assessment"}
              </h3>
              <p
                style={{
                  color: "#666",
                  fontSize: "16px",
                  marginBottom: "16px",
                }}
              >
                {isLessonPlanningMode
                  ? "Saving your essay configuration for the lesson plan..."
                  : "Creating your essay writing assessment based on the lesson plan..."}
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
                    ? "Configuring essay parameters"
                    : "Preparing writing prompts and evaluation criteria"}
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
        style={{ maxWidth: "700px" }}
      >
        {/* Standardized Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon">
              <EditOutlined />
            </div>
            <h3 className="modal-title">
              {isLessonPlanningMode
                ? "Configure Essay Writing"
                : "Essay Writing Assessment"}
            </h3>
          </div>
          <button className="modal-close" onClick={onClose} disabled={loading}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Info Alert for lesson planning mode */}
          {isLessonPlanningMode && (
            <Alert
              message="Configure Essay Writing Activity"
              description="Set up the parameters for your essay writing activity. This configuration will be saved with your lesson plan and used when generating assessments later."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          {/* Selected Lesson Plan Info - only show in assessment mode */}
          {!isLessonPlanningMode && selectedLessonPlan && (
            <Alert
              message={`Based on Lesson Plan: ${
                selectedLessonPlan.parameters?.specificTopic ||
                "Selected Lesson"
              }`}
              description={`Generate essay writing assessment for: ${
                selectedLessonPlan.classId?.className || "Class"
              } | ${selectedLessonPlan.parameters?.grade || "Grade"}`}
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          <Row gutter={[16, 24]}>
            {/* Essay Type */}
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
                    <FileTextOutlined style={{ color: "#1890ff" }} />
                    <span>Essay Type</span>
                  </div>
                }
              >
                <Select
                  placeholder="Choose essay type"
                  value={formData.essayType}
                  onChange={(value) => handleInputChange("essayType", value)}
                  style={{ width: "100%" }}
                  size="large"
                  disabled={loading}
                >
                  {essayTypes.map((type) => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Card>
            </Col>

            {/* Word Count and Duration */}
            <Col span={24}>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
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
                        <EditOutlined style={{ color: "#52c41a" }} />
                        <span>Word Count</span>
                      </div>
                    }
                  >
                    <Select
                      value={formData.wordCount}
                      onChange={(value) =>
                        handleInputChange("wordCount", value)
                      }
                      style={{ width: "100%" }}
                      size="large"
                      disabled={loading}
                    >
                      {wordCountOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Card>
                </Col>

                <Col xs={24} sm={12}>
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
                        <span>Duration</span>
                      </div>
                    }
                  >
                    <Select
                      value={formData.duration}
                      onChange={(value) => handleInputChange("duration", value)}
                      style={{ width: "100%" }}
                      size="large"
                      disabled={loading}
                    >
                      {durationOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Card>
                </Col>
              </Row>
            </Col>

            {/* Additional Requirements */}
            <Col span={24}>
              <Card
                size="small"
                title="Additional Requirements & Instructions (Optional)"
              >
                <TextArea
                  rows={4}
                  value={formData.additionalRequirement}
                  onChange={(e) =>
                    handleInputChange("additionalRequirement", e.target.value)
                  }
                  placeholder={
                    isLessonPlanningMode
                      ? "Enter specific essay prompts, themes, learning objectives, or any special considerations for this essay activity..."
                      : "Enter specific essay prompts, themes, learning objectives, or any special considerations for this essay assessment based on the selected lesson plan..."
                  }
                  maxLength={400}
                  showCount
                  disabled={loading}
                />
              </Card>
            </Col>

            {/* Summary */}
            <Col span={24}>
              <Card
                size="small"
                title="Essay Assessment Summary"
                style={{ background: "#f6ffed", borderColor: "#b7eb8f" }}
              >
                <Row gutter={[16, 8]}>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: "#666" }}>
                      Essay Type:
                    </Text>
                    <br />
                    <Tag color="blue">
                      {formData.essayType.replace("_", " ")}
                    </Tag>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: "#666" }}>
                      Word Count:
                    </Text>
                    <br />
                    <Tag color="green">{formData.wordCount}</Tag>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: "#666" }}>
                      Duration:
                    </Text>
                    <br />
                    <Tag color="orange">{formData.duration}</Tag>
                  </Col>
                  {!isLessonPlanningMode && selectedLessonPlan && (
                    <Col span={24}>
                      <Text strong style={{ color: "#666" }}>
                        Based on Lesson:
                      </Text>
                      <br />
                      <Text>
                        {selectedLessonPlan.parameters?.specificTopic ||
                          "Selected Lesson Plan"}
                      </Text>
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
                </Row>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Footer Buttons */}
        <div className="modal-footer">
          <div className="modal-footer-left">
            <button
              className="btn-reset"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </button>
          </div>
          <div className="modal-footer-right">
            <button className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              className={`btn-submit ${loading ? "loading" : ""}`}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingOutlined spin />{" "}
                  {isLessonPlanningMode ? "Saving..." : "Generating..."}
                </>
              ) : isLessonPlanningMode ? (
                "📝 Save Configuration"
              ) : (
                "📝 Generate Essay Assessment"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EssayLesson;
