//AssessmentLesson.jsx according to lesson planner
import React, { useState } from "react";
import {
  Card,
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
  InputNumber,
} from "antd";
import {
  FileTextOutlined,
  ClockCircleOutlined,
  EditOutlined,
  CheckCircleOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import {
  englishAssessmentTypes,
  questionTypes,
  timeAllocation,
} from "../../../data/englishAssessmentTypes";
import "./ModalStyles.css";

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

const AssessmentLesson = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    assessmentType: "",
    questionTypes: [],
    numberOfQuestions: 20,
    timeAllocation: "60",
    additionalRequirement: "",
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArrayToggle = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.assessmentType) {
      message.warning("Please select an assessment type");
      return;
    }

    if (formData.questionTypes.length === 0) {
      message.warning("Please select at least one question type");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      message.success("Assessment settings submitted successfully!");
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
      assessmentType: "",
      questionTypes: [],
      numberOfQuestions: 20,
      timeAllocation: "60",
      additionalRequirement: "",
    });
  };

  const getSelectedAssessmentDetails = () => {
    const allTypes = englishAssessmentTypes.reduce(
      (acc, cat) => [...acc, ...cat.types],
      []
    );
    return allTypes.find((type) => type.value === formData.assessmentType);
  };

  if (!isOpen) return null;

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
              <FileTextOutlined />
            </div>
            <h3 className="modal-title">English Assessment Generator</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <Row gutter={[16, 24]}>
            {/* Assessment Type */}
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
                    <EditOutlined style={{ color: "#52c41a" }} />
                    <span>Assessment Type</span>
                  </div>
                }
              >
                <Select
                  placeholder="Choose assessment type"
                  value={formData.assessmentType}
                  onChange={(value) =>
                    handleInputChange("assessmentType", value)
                  }
                  style={{ width: "100%" }}
                  size="large"
                  showSearch
                  filterOption={(input, option) =>
                    option.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {englishAssessmentTypes.map((category) => (
                    <React.Fragment key={category.category}>
                      <Option
                        disabled
                        value={category.category}
                        style={{ fontWeight: "bold", color: "#1890ff" }}
                      >
                        📂 {category.category}
                      </Option>
                      {category.types.map((type) => (
                        <Option
                          key={type.value}
                          value={type.value}
                          style={{ paddingLeft: "20px" }}
                        >
                          <div>
                            <div style={{ fontWeight: "500" }}>
                              {type.label}
                            </div>
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              {type.description} • {type.timeRange} •{" "}
                              {type.questionRange}
                            </Text>
                          </div>
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

                {/* Display selected assessment details */}
                {getSelectedAssessmentDetails() && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "8px",
                      background: "#f6ffed",
                      borderRadius: "6px",
                    }}
                  >
                    <Text strong style={{ color: "#52c41a" }}>
                      Selected:{" "}
                    </Text>
                    <Text>{getSelectedAssessmentDetails().label}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      Recommended: {getSelectedAssessmentDetails().timeRange} •{" "}
                      {getSelectedAssessmentDetails().questionRange}
                    </Text>
                  </div>
                )}
              </Card>
            </Col>

            {/* Question Types */}
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
                    <span>Question Types</span>
                  </div>
                }
              >
                {questionTypes.map((category) => (
                  <div key={category.category} style={{ marginBottom: "16px" }}>
                    <Text strong style={{ color: "#666", fontSize: "14px" }}>
                      {category.category}
                    </Text>
                    <Row gutter={[12, 12]} style={{ marginTop: "8px" }}>
                      {category.types.map((type) => (
                        <Col xs={24} sm={12} md={8} key={type.value}>
                          <Tooltip
                            title={
                              <div>
                                <div>
                                  <strong>{type.description}</strong>
                                </div>
                                <div style={{ marginTop: "4px" }}>
                                  Suitable for: {type.suitable.join(", ")}
                                </div>
                              </div>
                            }
                          >
                            <div
                              onClick={() =>
                                handleArrayToggle("questionTypes", type.value)
                              }
                              style={{
                                padding: "10px",
                                border: `2px solid ${
                                  formData.questionTypes.includes(type.value)
                                    ? "#1890ff"
                                    : "#d9d9d9"
                                }`,
                                borderRadius: "6px",
                                cursor: "pointer",
                                background: formData.questionTypes.includes(
                                  type.value
                                )
                                  ? "#e6f7ff"
                                  : "white",
                                transition: "all 0.2s ease",
                                textAlign: "center",
                                position: "relative",
                              }}
                            >
                              {formData.questionTypes.includes(type.value) && (
                                <CheckCircleOutlined
                                  style={{
                                    position: "absolute",
                                    top: "4px",
                                    right: "4px",
                                    color: "#1890ff",
                                  }}
                                />
                              )}
                              <div
                                style={{
                                  fontSize: "18px",
                                  marginBottom: "4px",
                                }}
                              >
                                {type.icon}
                              </div>
                              <div
                                style={{ fontWeight: "500", fontSize: "13px" }}
                              >
                                {type.label}
                              </div>
                            </div>
                          </Tooltip>
                        </Col>
                      ))}
                    </Row>
                  </div>
                ))}

                {formData.questionTypes.length > 0 && (
                  <div style={{ marginTop: "16px" }}>
                    <Text strong>Selected Question Types: </Text>
                    <Space wrap>
                      {formData.questionTypes.map((type) => {
                        const typeObj = questionTypes
                          .reduce((acc, cat) => [...acc, ...cat.types], [])
                          .find((t) => t.value === type);
                        return (
                          <Tag
                            key={type}
                            color="blue"
                            closable
                            onClose={() =>
                              handleArrayToggle("questionTypes", type)
                            }
                          >
                            {typeObj?.icon} {typeObj?.label}
                          </Tag>
                        );
                      })}
                    </Space>
                  </div>
                )}
              </Card>
            </Col>

            {/* Assessment Configuration */}
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
                        <EditOutlined style={{ color: "#1890ff" }} />
                        <span>Number of Questions</span>
                      </div>
                    }
                  >
                    <InputNumber
                      min={5}
                      max={100}
                      value={formData.numberOfQuestions}
                      onChange={(value) =>
                        handleInputChange("numberOfQuestions", value)
                      }
                      style={{ width: "100%" }}
                      size="large"
                    />
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
                        <span>Time Allocation</span>
                      </div>
                    }
                  >
                    <Select
                      value={formData.timeAllocation}
                      onChange={(value) =>
                        handleInputChange("timeAllocation", value)
                      }
                      style={{ width: "100%" }}
                      size="large"
                    >
                      {timeAllocation.map((time) => (
                        <Option key={time.value} value={time.value}>
                          {time.label}
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
                  placeholder="Enter specific instructions, learning objectives, marking criteria, or any special considerations for this assessment..."
                  maxLength={500}
                  showCount
                />
              </Card>
            </Col>

            {/* Assessment Preview Summary */}
            {(formData.assessmentType || formData.questionTypes.length > 0) && (
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
                      <CheckCircleOutlined style={{ color: "#52c41a" }} />
                      <span>Assessment Summary</span>
                    </div>
                  }
                  style={{ background: "#f6ffed", borderColor: "#b7eb8f" }}
                >
                  <Row gutter={[16, 8]}>
                    <Col xs={24} sm={12} md={6}>
                      <Text strong style={{ color: "#666" }}>
                        Assessment Type:
                      </Text>
                      <br />
                      <Text>
                        {getSelectedAssessmentDetails()?.label ||
                          "Not selected"}
                      </Text>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Text strong style={{ color: "#666" }}>
                        Questions:
                      </Text>
                      <br />
                      <Text>{formData.numberOfQuestions} questions</Text>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Text strong style={{ color: "#666" }}>
                        Duration:
                      </Text>
                      <br />
                      <Text>
                        {
                          timeAllocation.find(
                            (t) => t.value === formData.timeAllocation
                          )?.label
                        }
                      </Text>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Text strong style={{ color: "#666" }}>
                        Question Types:
                      </Text>
                      <br />
                      <Text>
                        {formData.questionTypes.length} types selected
                      </Text>
                    </Col>
                  </Row>
                </Card>
              </Col>
            )}
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
                !formData.assessmentType ||
                formData.questionTypes.length === 0 ||
                loading
              }
            >
              {loading ? "⏳ Generating..." : "📝 Generate Assessment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentLesson;
