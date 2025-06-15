//AssessmentLesson.jsx according to lesson planner - Updated with dynamic forms
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
  Alert,
} from "antd";
import {
  FileTextOutlined,
  ClockCircleOutlined,
  EditOutlined,
  CheckCircleOutlined,
  BulbOutlined,
  BookOutlined,
} from "@ant-design/icons";
import {
  englishAssessmentTypes,
  questionTypes,
  timeAllocation,
  difficultyLevels,
} from "../../data/englishAssessmentTypes";
import "./ModalStyles.css";

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

const AssessmentLessonMain = ({
  isOpen,
  onClose,
  onSubmit,
  selectedLessonPlan,
  activityType = "assessment", // New prop to determine form type
}) => {
  const [formData, setFormData] = useState({
    // Common fields
    additionalRequirement: "",

    // Assessment-specific fields
    assessmentType: "",
    questionTypes: [],
    numberOfQuestions: 20,
    timeAllocation: "60",

    // Essay-specific fields
    essayType: "short_communicative",
    format: "",
    purpose: "",
    theme: "",
    extendedType: "",
    topic: "",
    points: "",

    // Textbook-specific fields are handled by additionalRequirement
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
    // Validation based on activity type
    if (activityType === "assessment") {
      if (!formData.assessmentType) {
        message.warning("Please select an assessment type");
        return;
      }
      if (formData.questionTypes.length === 0) {
        message.warning("Please select at least one question type");
        return;
      }
    } else if (activityType === "essay") {
      if (!formData.essayType) {
        message.warning("Please select an essay type");
        return;
      }
      if (
        formData.essayType === "short_communicative" &&
        (!formData.format || !formData.purpose)
      ) {
        message.warning(
          "Please select format and purpose for short communicative message"
        );
        return;
      }
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        selectedLessonPlan,
        activityType,
      };
      await onSubmit(submitData);
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
      additionalRequirement: "",
      assessmentType: "",
      questionTypes: [],
      numberOfQuestions: 20,
      timeAllocation: "60",
      essayType: "short_communicative",
      format: "",
      purpose: "",
      theme: "",
      extendedType: "",
      topic: "",
      points: "",
    });
  };

  const getSelectedAssessmentDetails = () => {
    const allTypes = englishAssessmentTypes.reduce(
      (acc, cat) => [...acc, ...cat.types],
      []
    );
    return allTypes.find((type) => type.value === formData.assessmentType);
  };

  const getModalTitle = () => {
    switch (activityType) {
      case "assessment":
        return "Assessment Generator";
      case "essay":
        return "Essay Assignment";
      case "textbook":
        return "Textbook Activity";
      default:
        return "Assessment Activity";
    }
  };

  const getModalIcon = () => {
    switch (activityType) {
      case "assessment":
        return <FileTextOutlined />;
      case "essay":
        return <EditOutlined />;
      case "textbook":
        return <BookOutlined />;
      default:
        return <FileTextOutlined />;
    }
  };

  if (!isOpen) return null;

  // Render Assessment Form
  const renderAssessmentForm = () => (
    <>
      {/* Assessment Type */}
      <Col span={24}>
        <Card
          size="small"
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <EditOutlined style={{ color: "#52c41a" }} />
              <span>Assessment Type</span>
            </div>
          }
        >
          <Select
            placeholder="Choose assessment type"
            value={formData.assessmentType}
            onChange={(value) => handleInputChange("assessmentType", value)}
            style={{ width: "100%" }}
            size="large"
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
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
                      <div style={{ fontWeight: "500" }}>{type.label}</div>
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                        <div style={{ fontSize: "18px", marginBottom: "4px" }}>
                          {type.icon}
                        </div>
                        <div style={{ fontWeight: "500", fontSize: "13px" }}>
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
                      onClose={() => handleArrayToggle("questionTypes", type)}
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
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
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
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <ClockCircleOutlined style={{ color: "#722ed1" }} />
                  <span>Time Allocation</span>
                </div>
              }
            >
              <Select
                value={formData.timeAllocation}
                onChange={(value) => handleInputChange("timeAllocation", value)}
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
    </>
  );

  // Render Essay Form
  const renderEssayForm = () => (
    <>
      {/* Essay Type */}
      <Col span={24}>
        <Card size="small" title="Essay Type">
          <Select
            value={formData.essayType}
            onChange={(value) => handleInputChange("essayType", value)}
            style={{ width: "100%" }}
            size="large"
          >
            <Option value="short_communicative">
              Short Communicative Message
            </Option>
            <Option value="guided">Guided Writing</Option>
            <Option value="extended">Extended Writing</Option>
          </Select>
        </Card>
      </Col>

      {/* Short Communicative Fields */}
      {formData.essayType === "short_communicative" && (
        <>
          <Col span={24}>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Card size="small" title="Format">
                  <Select
                    value={formData.format}
                    onChange={(value) => handleInputChange("format", value)}
                    style={{ width: "100%" }}
                    size="large"
                    placeholder="Select format..."
                  >
                    <Option value="note">📄 Note</Option>
                    <Option value="email">✉️ Email</Option>
                  </Select>
                </Card>
              </Col>

              <Col xs={24} sm={12}>
                <Card size="small" title="Purpose">
                  <Select
                    value={formData.purpose}
                    onChange={(value) => handleInputChange("purpose", value)}
                    style={{ width: "100%" }}
                    size="large"
                    placeholder="Select purpose..."
                  >
                    <Option value="inform">ℹ️ Inform</Option>
                    <Option value="invite">🎉 Invite</Option>
                    <Option value="thank">🙏 Thank</Option>
                    <Option value="apologize">😔 Apologize</Option>
                    <Option value="remind">⏰ Remind</Option>
                    <Option value="ask">❓ Ask</Option>
                    <Option value="congratulate">🎊 Congratulate</Option>
                  </Select>
                </Card>
              </Col>
            </Row>
          </Col>
        </>
      )}

      {/* Guided Writing Fields */}
      {formData.essayType === "guided" && (
        <>
          <Col span={24}>
            <Card size="small" title="Theme">
              <Select
                value={formData.theme}
                onChange={(value) => handleInputChange("theme", value)}
                style={{ width: "100%" }}
                size="large"
                placeholder="Select theme..."
              >
                <Option value="personal_experience">
                  🌟 Personal Experience
                </Option>
                <Option value="school_life">🎓 School Life</Option>
                <Option value="hobbies_leisure">🎨 Hobbies / Leisure</Option>
                <Option value="advice_tips">💡 Advice / Tips</Option>
              </Select>
            </Card>
          </Col>

          <Col span={24}>
            <Card size="small" title="Key Points">
              <TextArea
                rows={4}
                placeholder="List 3–4 points here..."
                value={formData.points}
                onChange={(e) => handleInputChange("points", e.target.value)}
                maxLength={200}
                showCount
              />
            </Card>
          </Col>
        </>
      )}

      {/* Extended Writing Fields */}
      {formData.essayType === "extended" && (
        <>
          <Col span={24}>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Card size="small" title="Extended Type">
                  <Select
                    value={formData.extendedType}
                    onChange={(value) =>
                      handleInputChange("extendedType", value)
                    }
                    style={{ width: "100%" }}
                    size="large"
                    placeholder="Select type..."
                  >
                    <Option value="review">⭐ Review</Option>
                    <Option value="article">📰 Article</Option>
                    <Option value="report">📊 Report</Option>
                    <Option value="story">📚 Story</Option>
                  </Select>
                </Card>
              </Col>

              <Col xs={24} sm={12}>
                <Card size="small" title="Topic">
                  <Input
                    placeholder="Enter topic"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    size="large"
                  />
                </Card>
              </Col>
            </Row>
          </Col>

          <Col span={24}>
            <Card size="small" title="Key Points / Guidelines">
              <TextArea
                rows={4}
                placeholder="Add elaboration, evidence or points"
                value={formData.points}
                onChange={(e) => handleInputChange("points", e.target.value)}
                maxLength={300}
                showCount
              />
            </Card>
          </Col>
        </>
      )}
    </>
  );

  // Render Textbook Form
  const renderTextbookForm = () => (
    <Col span={24}>
      <Card size="small" title="Activity Requirements & Instructions">
        <TextArea
          rows={6}
          value={formData.additionalRequirement}
          onChange={(e) =>
            handleInputChange("additionalRequirement", e.target.value)
          }
          placeholder="Enter your requirements, instructions, or notes for this textbook activity based on the selected lesson plan..."
          maxLength={500}
          showCount
        />
      </Card>
    </Col>
  );

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
            <div className="modal-icon">{getModalIcon()}</div>
            <h3 className="modal-title">{getModalTitle()}</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Selected Lesson Plan Info */}
          {selectedLessonPlan && (
            <Alert
              message={`Based on Lesson Plan: ${
                selectedLessonPlan.title || "Selected Lesson"
              }`}
              description={`Activity Type: ${
                activityType.charAt(0).toUpperCase() + activityType.slice(1)
              } | ${selectedLessonPlan.class || "Class"} | ${
                selectedLessonPlan.grade || "Grade"
              }`}
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          <Row gutter={[16, 24]}>
            {/* Render form based on activity type */}
            {activityType === "assessment" && renderAssessmentForm()}
            {activityType === "essay" && renderEssayForm()}
            {activityType === "textbook" && renderTextbookForm()}

            {/* Additional Requirements - Common for all types */}
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
                  placeholder="Enter specific instructions, learning objectives, or any special considerations..."
                  maxLength={500}
                  showCount
                />
              </Card>
            </Col>

            {/* Assessment Preview Summary */}
            {(formData.assessmentType ||
              formData.essayType ||
              activityType === "textbook") && (
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
                      <span>Summary</span>
                    </div>
                  }
                  style={{ background: "#f6ffed", borderColor: "#b7eb8f" }}
                >
                  <Row gutter={[16, 8]}>
                    <Col xs={24} sm={12} md={6}>
                      <Text strong style={{ color: "#666" }}>
                        Activity Type:
                      </Text>
                      <br />
                      <Text>
                        {activityType.charAt(0).toUpperCase() +
                          activityType.slice(1)}
                      </Text>
                    </Col>

                    {activityType === "assessment" && (
                      <>
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
                      </>
                    )}

                    {activityType === "essay" && (
                      <>
                        <Col xs={24} sm={12} md={6}>
                          <Text strong style={{ color: "#666" }}>
                            Essay Type:
                          </Text>
                          <br />
                          <Text>{formData.essayType.replace("_", " ")}</Text>
                        </Col>
                        {formData.format && (
                          <Col xs={24} sm={12} md={6}>
                            <Text strong style={{ color: "#666" }}>
                              Format:
                            </Text>
                            <br />
                            <Text>{formData.format}</Text>
                          </Col>
                        )}
                        {formData.purpose && (
                          <Col xs={24} sm={12} md={6}>
                            <Text strong style={{ color: "#666" }}>
                              Purpose:
                            </Text>
                            <br />
                            <Text>{formData.purpose}</Text>
                          </Col>
                        )}
                      </>
                    )}

                    {selectedLessonPlan && (
                      <Col xs={24} sm={12} md={6}>
                        <Text strong style={{ color: "#666" }}>
                          Based on Lesson:
                        </Text>
                        <br />
                        <Text>
                          {selectedLessonPlan.title || "Selected Lesson Plan"}
                        </Text>
                      </Col>
                    )}
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
                (activityType === "assessment" &&
                  (!formData.assessmentType ||
                    formData.questionTypes.length === 0)) ||
                (activityType === "essay" && !formData.essayType) ||
                loading
              }
            >
              {loading ? "⏳ Generating..." : `📝 Generate ${getModalTitle()}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentLessonMain;
