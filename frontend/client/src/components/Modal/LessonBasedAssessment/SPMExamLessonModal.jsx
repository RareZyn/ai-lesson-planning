// SPMExamLessonModal.jsx
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
  Checkbox,
  InputNumber,
  message,
  Alert,
  Spin,
  Collapse,
} from "antd";
import {
  FileTextOutlined,
  BookOutlined,
  EditOutlined,
  ClockCircleOutlined,
  BulbOutlined,
  LoadingOutlined,
  RedoOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import {
  paperTypes,
  spmForms,
  textSources,
  readingLevels,
  topicCategories,
  communicationFormats,
  essayTypes,
  promptComplexity,
  questionTypes,
  difficultyLevels,
  timeAllocations,
  validateSPMConfiguration,
} from "../../../data/spmExamTypes";
import "./ModalStyles.css";

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const SPMExamLessonModal = ({
  isOpen,
  onClose,
  onSubmit,
  selectedLessonPlan,
  isLessonPlanningMode = false,
  existingConfiguration = null,
  isRegenerateMode = false,
  existingAssessment = null,
}) => {
  const [formData, setFormData] = useState({
    paperType: "paper1",
    form: "form5",
    timeAllocation: "90",
    difficultyLevel: "intermediate",
    // Paper 1 specific
    textSources: ["newspapers", "magazines"],
    readingLevel: "form5",
    topics: ["people_culture"],
    questionTypes: {
      multipleChoiceOptions: 3,
      clozeTestFocus: "mixed",
      matchingComplexity: "moderate",
    },
    // Paper 2 specific
    communicationFormat: "email",
    essayTypes: ["descriptive", "narrative"],
    topicCategories: ["people_culture"],
    promptComplexity: "moderate",
    // Common
    specificTopic: "",
    learningObjectives: "",
    additionalRequirement: "",
  });

  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Load existing configuration if available
  useEffect(() => {
    if (existingConfiguration) {
      setFormData((prev) => ({
        ...prev,
        ...existingConfiguration,
      }));
    }
  }, [existingConfiguration]);

  // Validate form whenever formData changes
  useEffect(() => {
    const validation = validateSPMConfiguration(formData);
    setValidationErrors(validation.errors);
  }, [formData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedInputChange = (parentField, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [field]: value,
      },
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
    const validation = validateSPMConfiguration(formData);
    if (!validation.isValid) {
      message.error("Please fix the validation errors before submitting");
      return;
    }

    if (!formData.specificTopic.trim()) {
      message.warning("Please specify a topic for the SPM exam");
      return;
    }

    setLoading(true);
    try {
      let submitData;

      if (isLessonPlanningMode) {
        submitData = {
          ...formData,
          configuredFor: "spm-exam",
        };
        await onSubmit(submitData);
        message.success("SPM exam configuration saved successfully!");
      } else if (isRegenerateMode) {
        submitData = {
          ...formData,
          activityType: "smp-exam",
          isRegeneration: true,
          existingAssessmentId: existingAssessment?._id,
        };
        await onSubmit(submitData);
      } else {
        submitData = {
          ...formData,
          selectedLessonPlan,
          activityType: "spm-exam",
        };
        await onSubmit(submitData);
        message.success("SPM exam settings submitted successfully!");
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
      paperType: "paper1",
      form: "form5",
      timeAllocation: "90",
      difficultyLevel: "intermediate",
      textSources: ["newspapers", "magazines"],
      readingLevel: "form5",
      topics: ["people_culture"],
      questionTypes: {
        multipleChoiceOptions: 3,
        clozeTestFocus: "mixed",
        matchingComplexity: "moderate",
      },
      communicationFormat: "email",
      essayTypes: ["descriptive", "narrative"],
      topicCategories: ["people_culture"],
      promptComplexity: "moderate",
      specificTopic: "",
      learningObjectives: "",
      additionalRequirement: "",
    });
  };

  const getSelectedPaperDetails = () => {
    return paperTypes.find((paper) => paper.value === formData.paperType);
  };

  if (!isOpen) return null;

  // Loading overlay
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
                  ? "Regenerating SPM Exam"
                  : "Generating SPM Exam"}
              </h3>
              <p style={{ color: "#666", fontSize: "16px" }}>
                {isLessonPlanningMode
                  ? "Saving your SPM exam configuration..."
                  : isRegenerateMode
                  ? "Regenerating SPM exam with new settings..."
                  : "Creating your SPM exam based on the lesson plan..."}
              </p>
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
        style={{ maxWidth: "1000px", maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon">
              {isRegenerateMode ? <RedoOutlined /> : <FileTextOutlined />}
            </div>
            <h3 className="modal-title">
              {isLessonPlanningMode
                ? "Configure SPM English Exam"
                : isRegenerateMode
                ? "Regenerate SPM English Exam"
                : "SPM English Exam Generator"}
            </h3>
          </div>
          <button className="modal-close" onClick={onClose} disabled={loading}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Info Alerts */}
          {isLessonPlanningMode && (
            <Alert
              message="Configure SPM Exam Parameters"
              description="Set up the SPM exam configuration. This will be saved with your lesson plan for later assessment generation."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          {isRegenerateMode && (
            <Alert
              message="Regenerate SPM Exam"
              description={`Update settings for "${selectedLessonPlan?.title}" SPM exam. The existing exam will be replaced.`}
              type="warning"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          {!isLessonPlanningMode && selectedLessonPlan && (
            <Alert
              message={`${
                isRegenerateMode ? "Regenerating" : "Based on"
              } Lesson Plan: ${selectedLessonPlan?.title || "Selected Lesson"}`}
              description={`Generate SPM exam for ${
                selectedLessonPlan?.classId?.className || "Class"
              } - ${selectedLessonPlan?.parameters?.grade || "Form 5"}`}
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert
              message="Configuration Issues"
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              }
              type="error"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          <Row gutter={[16, 24]}>
            {/* Basic Configuration */}
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
                    <InfoCircleOutlined style={{ color: "#1890ff" }} />
                    <span>Basic Configuration</span>
                  </div>
                }
              >
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: 500,
                      }}
                    >
                      Form Level *
                    </label>
                    <Select
                      value={formData.form}
                      onChange={(value) => handleInputChange("form", value)}
                      style={{ width: "100%" }}
                      size="large"
                    >
                      {spmForms.map((form) => (
                        <Option key={form.value} value={form.value}>
                          {form.label} - {form.description}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={24} sm={12}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: 500,
                      }}
                    >
                      Time Allocation
                    </label>
                    <Select
                      value={formData.timeAllocation}
                      onChange={(value) =>
                        handleInputChange("timeAllocation", value)
                      }
                      style={{ width: "100%" }}
                      size="large"
                    >
                      {timeAllocations.map((time) => (
                        <Option key={time.value} value={time.value}>
                          {time.label} - {time.description}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                </Row>

                <Row gutter={16} style={{ marginTop: 16 }}>
                  <Col span={24}>
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
                      placeholder="Enter the specific topic for this SPM exam"
                      value={formData.specificTopic}
                      onChange={(e) =>
                        handleInputChange("specificTopic", e.target.value)
                      }
                      size="large"
                      maxLength={100}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Paper Type Selection */}
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
                    <FileTextOutlined style={{ color: "#52c41a" }} />
                    <span>Paper Type Selection *</span>
                  </div>
                }
              >
                <Radio.Group
                  value={formData.paperType}
                  onChange={(e) =>
                    handleInputChange("paperType", e.target.value)
                  }
                  style={{ width: "100%" }}
                >
                  <Row gutter={[16, 16]}>
                    {paperTypes.map((paper) => (
                      <Col xs={24} sm={12} key={paper.value}>
                        <Radio.Button
                          value={paper.value}
                          style={{
                            width: "100%",
                            height: "auto",
                            padding: "16px",
                            textAlign: "left",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: "16px",
                                fontWeight: "600",
                                marginBottom: "8px",
                              }}
                            >
                              {paper.label}
                            </div>
                            <div
                              style={{
                                fontSize: "13px",
                                color: "#666",
                                marginBottom: "8px",
                              }}
                            >
                              {paper.description}
                            </div>
                            <Space>
                              <Tag color="blue">{paper.duration}</Tag>
                              {paper.totalQuestions && (
                                <Tag color="green">
                                  {paper.totalQuestions} questions
                                </Tag>
                              )}
                              {paper.totalParts && (
                                <Tag color="green">
                                  {paper.totalParts} parts
                                </Tag>
                              )}
                              <Tag color="orange">{paper.totalMarks} marks</Tag>
                            </Space>
                          </div>
                        </Radio.Button>
                      </Col>
                    ))}
                  </Row>
                </Radio.Group>

                {/* Paper Structure Preview */}
                {getSelectedPaperDetails() && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: 12,
                      background: "#f6ffed",
                      borderRadius: 8,
                    }}
                  >
                    <Text strong>Paper Structure:</Text>
                    <Row gutter={8} style={{ marginTop: 8 }}>
                      {getSelectedPaperDetails().parts.map((part, index) => (
                        <Col xs={24} sm={12} md={8} key={index}>
                          <div style={{ fontSize: "12px" }}>
                            <Text strong>{part.name}:</Text> {part.description}
                            {part.questions && ` (${part.questions} questions)`}
                            {part.marks && ` (${part.marks} marks)`}
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}
              </Card>
            </Col>

            {/* Paper 1 Configuration */}
            {formData.paperType === "paper1" && (
              <Col span={24}>
                <Collapse defaultActiveKey={["sources", "difficulty"]}>
                  <Panel
                    header="Text Sources & Reading Level"
                    key="sources"
                    extra={<BookOutlined />}
                  >
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: 500,
                          }}
                        >
                          Text Sources *
                        </label>
                        <Checkbox.Group
                          value={formData.textSources}
                          onChange={(values) =>
                            handleInputChange("textSources", values)
                          }
                          style={{ width: "100%" }}
                        >
                          <Row>
                            {textSources.map((source) => (
                              <Col
                                xs={24}
                                sm={12}
                                key={source.value}
                                style={{ marginBottom: 8 }}
                              >
                                <Tooltip title={source.description}>
                                  <Checkbox value={source.value}>
                                    {source.label}
                                  </Checkbox>
                                </Tooltip>
                              </Col>
                            ))}
                          </Row>
                        </Checkbox.Group>
                      </Col>

                      <Col xs={24} sm={12}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: 500,
                          }}
                        >
                          Reading Level *
                        </label>
                        <Select
                          value={formData.readingLevel}
                          onChange={(value) =>
                            handleInputChange("readingLevel", value)
                          }
                          style={{ width: "100%" }}
                          size="large"
                        >
                          {readingLevels.map((level) => (
                            <Option key={level.value} value={level.value}>
                              {level.label} - {level.description}
                            </Option>
                          ))}
                        </Select>
                      </Col>
                    </Row>

                    <Row gutter={16} style={{ marginTop: 16 }}>
                      <Col span={24}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: 500,
                          }}
                        >
                          Topic Categories
                        </label>
                        <Checkbox.Group
                          value={formData.topics}
                          onChange={(values) =>
                            handleInputChange("topics", values)
                          }
                          style={{ width: "100%" }}
                        >
                          <Row>
                            {topicCategories.map((topic) => (
                              <Col
                                xs={24}
                                sm={12}
                                md={8}
                                key={topic.value}
                                style={{ marginBottom: 8 }}
                              >
                                <Tooltip title={topic.description}>
                                  <Checkbox value={topic.value}>
                                    {topic.label}
                                  </Checkbox>
                                </Tooltip>
                              </Col>
                            ))}
                          </Row>
                        </Checkbox.Group>
                      </Col>
                    </Row>
                  </Panel>

                  <Panel
                    header="Question Configuration"
                    key="difficulty"
                    extra={<EditOutlined />}
                  >
                    <Row gutter={16}>
                      <Col xs={24} sm={8}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: 500,
                          }}
                        >
                          Multiple Choice Options
                        </label>
                        <InputNumber
                          min={3}
                          max={4}
                          value={formData.questionTypes.multipleChoiceOptions}
                          onChange={(value) =>
                            handleNestedInputChange(
                              "questionTypes",
                              "multipleChoiceOptions",
                              value
                            )
                          }
                          style={{ width: "100%" }}
                          size="large"
                        />
                      </Col>

                      <Col xs={24} sm={8}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: 500,
                          }}
                        >
                          Cloze Test Focus
                        </label>
                        <Select
                          value={formData.questionTypes.clozeTestFocus}
                          onChange={(value) =>
                            handleNestedInputChange(
                              "questionTypes",
                              "clozeTestFocus",
                              value
                            )
                          }
                          style={{ width: "100%" }}
                          size="large"
                        >
                          <Option value="grammar">Grammar Focus</Option>
                          <Option value="vocabulary">Vocabulary Focus</Option>
                          <Option value="mixed">Mixed Skills</Option>
                        </Select>
                      </Col>

                      <Col xs={24} sm={8}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: 500,
                          }}
                        >
                          Matching Complexity
                        </label>
                        <Select
                          value={formData.questionTypes.matchingComplexity}
                          onChange={(value) =>
                            handleNestedInputChange(
                              "questionTypes",
                              "matchingComplexity",
                              value
                            )
                          }
                          style={{ width: "100%" }}
                          size="large"
                        >
                          <Option value="simple">Simple</Option>
                          <Option value="moderate">Moderate</Option>
                          <Option value="complex">Complex</Option>
                        </Select>
                      </Col>
                    </Row>
                  </Panel>
                </Collapse>
              </Col>
            )}

            {/* Paper 2 Configuration */}
            {formData.paperType === "paper2" && (
              <Col span={24}>
                <Collapse defaultActiveKey={["writing", "topics"]}>
                  <Panel
                    header="Writing Configuration"
                    key="writing"
                    extra={<EditOutlined />}
                  >
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: 500,
                          }}
                        >
                          Communication Format *
                        </label>
                        <Select
                          value={formData.communicationFormat}
                          onChange={(value) =>
                            handleInputChange("communicationFormat", value)
                          }
                          style={{ width: "100%" }}
                          size="large"
                        >
                          {communicationFormats.map((format) => (
                            <Option key={format.value} value={format.value}>
                              {format.label} - {format.description}
                            </Option>
                          ))}
                        </Select>
                      </Col>

                      <Col xs={24} sm={12}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: 500,
                          }}
                        >
                          Prompt Complexity
                        </label>
                        <Select
                          value={formData.promptComplexity}
                          onChange={(value) =>
                            handleInputChange("promptComplexity", value)
                          }
                          style={{ width: "100%" }}
                          size="large"
                        >
                          {promptComplexity.map((level) => (
                            <Option key={level.value} value={level.value}>
                              {level.label} - {level.description}
                            </Option>
                          ))}
                        </Select>
                      </Col>
                    </Row>
                  </Panel>

                  <Panel
                    header="Essay Types & Topics"
                    key="topics"
                    extra={<BulbOutlined />}
                  >
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: 500,
                          }}
                        >
                          Essay Types *
                        </label>
                        <Checkbox.Group
                          value={formData.essayTypes}
                          onChange={(values) =>
                            handleInputChange("essayTypes", values)
                          }
                          style={{ width: "100%" }}
                        >
                          <Row>
                            {essayTypes.map((type) => (
                              <Col
                                xs={24}
                                sm={12}
                                key={type.value}
                                style={{ marginBottom: 8 }}
                              >
                                <Tooltip title={type.description}>
                                  <Checkbox value={type.value}>
                                    {type.label}
                                  </Checkbox>
                                </Tooltip>
                              </Col>
                            ))}
                          </Row>
                        </Checkbox.Group>
                      </Col>

                      <Col xs={24} sm={12}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: 500,
                          }}
                        >
                          Topic Categories
                        </label>
                        <Checkbox.Group
                          value={formData.topicCategories}
                          onChange={(values) =>
                            handleInputChange("topicCategories", values)
                          }
                          style={{ width: "100%" }}
                        >
                          <Row>
                            {topicCategories.map((topic) => (
                              <Col
                                xs={24}
                                key={topic.value}
                                style={{ marginBottom: 8 }}
                              >
                                <Tooltip title={topic.description}>
                                  <Checkbox value={topic.value}>
                                    {topic.label}
                                  </Checkbox>
                                </Tooltip>
                              </Col>
                            ))}
                          </Row>
                        </Checkbox.Group>
                      </Col>
                    </Row>
                  </Panel>
                </Collapse>
              </Col>
            )}

            {/* Learning Objectives */}
            <Col span={24}>
              <Card size="small" title="Learning Objectives (Optional)">
                <TextArea
                  rows={3}
                  placeholder="What specific learning outcomes should this SPM exam assess?"
                  value={formData.learningObjectives}
                  onChange={(e) =>
                    handleInputChange("learningObjectives", e.target.value)
                  }
                  maxLength={300}
                  showCount
                />
              </Card>
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
                      ? "Enter specific instructions, marking schemes, or special considerations for this SPM exam configuration..."
                      : isRegenerateMode
                      ? "Update instructions, marking schemes, or special considerations for the regenerated SPM exam..."
                      : "Enter specific instructions, marking schemes, or special considerations for this SPM exam..."
                  }
                  maxLength={500}
                  showCount
                />
              </Card>
            </Col>

            {/* Summary Card */}
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
                    <span>
                      SPM Exam {isRegenerateMode ? "Regeneration" : ""} Summary
                    </span>
                  </div>
                }
                style={{ background: "#f6ffed", borderColor: "#b7eb8f" }}
              >
                <Row gutter={[16, 8]}>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: "#666" }}>
                      Paper Type:
                    </Text>
                    <br />
                    <Tag color="blue">
                      {getSelectedPaperDetails()?.label || "Not selected"}
                    </Tag>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: "#666" }}>
                      Form Level:
                    </Text>
                    <br />
                    <Tag color="green">{formData.form.toUpperCase()}</Tag>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: "#666" }}>
                      Duration:
                    </Text>
                    <br />
                    <Tag color="orange">{formData.timeAllocation} minutes</Tag>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: "#666" }}>
                      Topic:
                    </Text>
                    <br />
                    <Text>{formData.specificTopic || "Not specified"}</Text>
                  </Col>

                  {formData.paperType === "paper1" && (
                    <>
                      <Col xs={24} sm={12} md={8}>
                        <Text strong style={{ color: "#666" }}>
                          Text Sources:
                        </Text>
                        <br />
                        <Text>{formData.textSources.length} selected</Text>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Text strong style={{ color: "#666" }}>
                          Reading Level:
                        </Text>
                        <br />
                        <Tag color="purple">{formData.readingLevel}</Tag>
                      </Col>
                    </>
                  )}

                  {formData.paperType === "paper2" && (
                    <>
                      <Col xs={24} sm={12} md={8}>
                        <Text strong style={{ color: "#666" }}>
                          Communication Format:
                        </Text>
                        <br />
                        <Tag color="cyan">{formData.communicationFormat}</Tag>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Text strong style={{ color: "#666" }}>
                          Essay Types:
                        </Text>
                        <br />
                        <Text>{formData.essayTypes.length} selected</Text>
                      </Col>
                    </>
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
                        The existing exam will be replaced with new content
                      </Text>
                    </Col>
                  )}
                </Row>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Footer */}
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
              className={`btn-submit ${
                validationErrors.length > 0 || !formData.specificTopic.trim()
                  ? "disabled"
                  : ""
              } ${loading ? "loading" : ""}`}
              onClick={handleSubmit}
              disabled={
                validationErrors.length > 0 ||
                !formData.specificTopic.trim() ||
                loading
              }
            >
              {loading ? (
                <>
                  <LoadingOutlined spin />{" "}
                  {isLessonPlanningMode
                    ? "Saving..."
                    : isRegenerateMode
                    ? "Regenerating..."
                    : "Generating..."}
                </>
              ) : isLessonPlanningMode ? (
                "📝 Save Configuration"
              ) : isRegenerateMode ? (
                "🔄 Regenerate SPM Exam"
              ) : (
                "📝 Generate SPM Exam"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SPMExamLessonModal;
