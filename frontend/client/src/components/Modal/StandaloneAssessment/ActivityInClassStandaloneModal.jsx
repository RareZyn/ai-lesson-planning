// Updated ActivityInClassStandaloneModal.jsx with enhanced features for standalone assessments
import React, { useState } from "react";
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
} from "antd";
import {
  ThunderboltOutlined,
  TeamOutlined,
  BookOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {
  bloomTaxonomyLevels,
  classroomActivityTypes,
  studentArrangementOptions,
  resourceOptions,
  timeDurationOptions,
  difficultyLevels,
} from "../../../data/activityTypesInClass";
import "./ModalStyles.css";

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

const ActivityInClassStandaloneModal = ({
  isOpen,
  onClose,
  onSubmit,
  assessmentData,
}) => {
  const [formData, setFormData] = useState({
    studentArrangement: "small_group",
    resourceUsage: "classroom_only",
    bloomTaxonomy: ["apply"], 
    activityType: "",
    duration: "30-45 minutes",
    difficultyLevel: "Intermediate",
    learningObjectives: "",
    specificTopic: "",
    additionalRequirement: "",
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBloomTaxonomyToggle = (level) => {
    setFormData((prev) => ({
      ...prev,
      bloomTaxonomy: prev.bloomTaxonomy.includes(level)
        ? prev.bloomTaxonomy.filter((l) => l !== level)
        : [...prev.bloomTaxonomy, level],
    }));
  };

  const handleSubmit = async () => {
    // Enhanced validation for standalone assessments
    if (!formData.studentArrangement || !formData.resourceUsage) {
      message.warning("Please fill in all required fields");
      return;
    }

    if (formData.bloomTaxonomy.length === 0) {
      message.warning("Please select at least one Bloom Taxonomy level");
      return;
    }

    if (!formData.specificTopic.trim()) {
      message.warning("Please specify a topic for the activity");
      return;
    }

    setLoading(true);
    try {
      // Enhanced data preparation for standalone assessment
      const submitData = {
        ...formData,
        ...assessmentData, // Include grade, subject, class info
        activityType: "activity",
        isStandalone: true,
        assessmentTitle: `${formData.specificTopic} - Activity in Class (${assessmentData.grade})`,
        assessmentDescription:
          formData.learningObjectives ||
          `Interactive classroom activity for ${formData.specificTopic}`,
      };

      console.log("Submitting standalone activity data:", submitData);

      await onSubmit(submitData);
      message.success("Activity settings submitted successfully!");
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
      bloomTaxonomy: ["apply"],
      activityType: "",
      duration: "30-45 minutes",
      difficultyLevel: "Intermediate",
      learningObjectives: "",
      specificTopic: "",
      additionalRequirement: "",
    });
  };

  const getBloomTagColor = (level) => {
    const bloomLevel = bloomTaxonomyLevels.find((b) => b.level === level);
    return bloomLevel ? bloomLevel.color : "#1890ff";
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "900px" }}
      >
        {/* Standardized Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon">
              <ThunderboltOutlined />
            </div>
            <h3 className="modal-title">Create Activity in Class</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Assessment Info Alert */}
          <Alert
            message="Standalone Activity Assessment"
            description={`Creating an interactive classroom activity for ${
              assessmentData?.subject || "your subject"
            } - ${assessmentData?.grade || "Grade"} ${
              assessmentData?.className ? `(${assessmentData.className})` : ""
            }`}
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 24 }}
          />

          <Row gutter={[16, 24]}>
            {/* Topic and Learning Objectives */}
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
                    <span>Activity Topic & Objectives</span>
                  </div>
                }
              >
                <Row gutter={16}>
                  <Col span={24} style={{ marginBottom: 16 }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: 500,
                      }}
                    >
                      Specific Topic *
                    </label>
                    <Input
                      placeholder="Enter the specific topic for this activity (e.g., 'Photosynthesis Process', 'Past Tense Verbs')"
                      value={formData.specificTopic}
                      onChange={(e) =>
                        handleInputChange("specificTopic", e.target.value)
                      }
                      size="large"
                      maxLength={100}
                    />
                  </Col>
                  <Col span={24}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: 500,
                      }}
                    >
                      Learning Objectives (Optional)
                    </label>
                    <TextArea
                      rows={3}
                      placeholder="What should students learn or achieve from this activity?"
                      value={formData.learningObjectives}
                      onChange={(e) =>
                        handleInputChange("learningObjectives", e.target.value)
                      }
                      maxLength={300}
                      showCount
                    />
                  </Col>
                </Row>
              </Card>
            </Col>

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

            {/* Activity Type Selection */}
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
                    <span>Specific Activity Type (Optional)</span>
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

            {/* Duration and Difficulty */}
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
                        <ClockCircleOutlined style={{ color: "#722ed1" }} />
                        <span>Duration</span>
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
                    >
                      {timeDurationOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                          <Text
                            type="secondary"
                            style={{ fontSize: "12px", display: "block" }}
                          >
                            {option.description}
                          </Text>
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
                        <BarChartOutlined style={{ color: "#eb2f96" }} />
                        <span>Difficulty Level</span>
                      </div>
                    }
                  >
                    <Select
                      placeholder="Select difficulty"
                      value={formData.difficultyLevel}
                      onChange={(value) =>
                        handleInputChange("difficultyLevel", value)
                      }
                      style={{ width: "100%" }}
                      size="large"
                      allowClear
                    >
                      {difficultyLevels.map((level) => (
                        <Option key={level.value} value={level.value}>
                          <Tag
                            color={level.color}
                            style={{ marginRight: "8px" }}
                          >
                            {level.label}
                          </Tag>
                          {level.description}
                        </Option>
                      ))}
                    </Select>
                  </Card>
                </Col>
              </Row>
            </Col>

            {/* Bloom Taxonomy */}
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
                    <SettingOutlined style={{ color: "#13c2c2" }} />
                    <span>Bloom's Taxonomy Levels</span>
                  </div>
                }
              >
                <Row gutter={[12, 12]}>
                  {bloomTaxonomyLevels.map((bloom) => (
                    <Col xs={12} sm={8} md={6} key={bloom.level}>
                      <Tooltip
                        title={
                          <div>
                            <div>
                              <strong>{bloom.description}</strong>
                            </div>
                            <div style={{ marginTop: "4px" }}>
                              Keywords: {bloom.keywords.join(", ")}
                            </div>
                          </div>
                        }
                      >
                        <div
                          onClick={() => handleBloomTaxonomyToggle(bloom.level)}
                          style={{
                            padding: "12px",
                            border: `2px solid ${
                              formData.bloomTaxonomy.includes(bloom.level)
                                ? bloom.color
                                : "#d9d9d9"
                            }`,
                            borderRadius: "8px",
                            textAlign: "center",
                            cursor: "pointer",
                            backgroundColor: formData.bloomTaxonomy.includes(
                              bloom.level
                            )
                              ? `${bloom.color}15`
                              : "white",
                            transition: "all 0.3s ease",
                            position: "relative",
                          }}
                        >
                          {formData.bloomTaxonomy.includes(bloom.level) && (
                            <CheckCircleOutlined
                              style={{
                                position: "absolute",
                                top: "4px",
                                right: "4px",
                                color: bloom.color,
                              }}
                            />
                          )}
                          <div
                            style={{
                              fontWeight: "600",
                              color: formData.bloomTaxonomy.includes(
                                bloom.level
                              )
                                ? bloom.color
                                : "#666",
                              fontSize: "14px",
                            }}
                          >
                            {bloom.level}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#999",
                              marginTop: "2px",
                            }}
                          >
                            {bloom.description}
                          </div>
                        </div>
                      </Tooltip>
                    </Col>
                  ))}
                </Row>

                {formData.bloomTaxonomy.length > 0 && (
                  <div style={{ marginTop: "16px" }}>
                    <Text strong>Selected Levels: </Text>
                    <Space wrap>
                      {formData.bloomTaxonomy.map((level) => (
                        <Tag
                          key={level}
                          color={getBloomTagColor(level)}
                          closable
                          onClose={() => handleBloomTaxonomyToggle(level)}
                        >
                          {level}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                )}
              </Card>
            </Col>

            {/* Additional Requirements */}
            <Col span={24}>
              <Card
                size="small"
                title="Additional Requirements & Notes (Optional)"
              >
                <TextArea
                  rows={4}
                  value={formData.additionalRequirement}
                  onChange={(e) =>
                    handleInputChange("additionalRequirement", e.target.value)
                  }
                  placeholder="Enter specific instructions, materials needed, assessment criteria, or any special considerations for this standalone activity..."
                  maxLength={400}
                  showCount
                />
              </Card>
            </Col>

            {/* Summary */}
            <Col span={24}>
              <Card
                size="small"
                title="Activity Summary"
                style={{ background: "#f6ffed", borderColor: "#b7eb8f" }}
              >
                <Row gutter={[16, 8]}>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: "#666" }}>
                      Subject & Grade:
                    </Text>
                    <br />
                    <Tag color="blue">
                      {assessmentData?.subject || "Subject"} -{" "}
                      {assessmentData?.grade || "Grade"}
                    </Tag>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: "#666" }}>
                      Topic:
                    </Text>
                    <br />
                    <Text>{formData.specificTopic || "Not specified"}</Text>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: "#666" }}>
                      Student Setup:
                    </Text>
                    <br />
                    <Tag color="purple">
                      {formData.studentArrangement.replace("_", " ")}
                    </Tag>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: "#666" }}>
                      Resources:
                    </Text>
                    <br />
                    <Tag color="green">
                      {formData.resourceUsage.replace("_", " ")}
                    </Tag>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: "#666" }}>
                      Duration:
                    </Text>
                    <br />
                    <Tag color="orange">{formData.duration}</Tag>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: "#666" }}>
                      Difficulty:
                    </Text>
                    <br />
                    <Tag color="red">{formData.difficultyLevel}</Tag>
                  </Col>
                  {formData.activityType && (
                    <Col xs={24} sm={12} md={8}>
                      <Text strong style={{ color: "#666" }}>
                        Activity Type:
                      </Text>
                      <br />
                      <Tag color="cyan">{formData.activityType}</Tag>
                    </Col>
                  )}
                  {assessmentData?.className && (
                    <Col xs={24} sm={12} md={8}>
                      <Text strong style={{ color: "#666" }}>
                        Class:
                      </Text>
                      <br />
                      <Text>{assessmentData.className}</Text>
                    </Col>
                  )}
                  <Col span={24}>
                    <Text strong style={{ color: "#666" }}>
                      Bloom's Taxonomy:
                    </Text>
                    <br />
                    <Space wrap>
                      {formData.bloomTaxonomy.map((level) => (
                        <Tag key={level} color={getBloomTagColor(level)}>
                          {level}
                        </Tag>
                      ))}
                    </Space>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Standardized Footer */}
        <div className="modal-footer">
          <div className="modal-footer-left">
            <button
              className="btn-reset"
              onClick={handleReset}
              disabled={loading}
            >
              Reset All
            </button>
          </div>
          <div className="modal-footer-right">
            <button className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              className={`btn-submit ${loading ? "loading" : ""}`}
              onClick={handleSubmit}
              disabled={
                formData.bloomTaxonomy.length === 0 ||
                !formData.specificTopic.trim() ||
                loading
              }
            >
              {loading ? "⏳ Creating..." : "✨ Create Standalone Activity"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityInClassStandaloneModal;
