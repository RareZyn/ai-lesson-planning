// SPMExamStandaloneModal.jsx 
import React, { useState } from "react";
import {
  Card,
  Radio,
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
  Collapse,
} from "antd";
import {
  FileTextOutlined,
  BookOutlined,
  EditOutlined,
  BulbOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CalculatorOutlined,
  LoadingOutlined,
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
  difficultyLevels,
  timeAllocations,
  validateSPMConfiguration,
} from "../../../data/spmExamTypes";
import "./ModalStyles.css";

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const SPMExamStandaloneModal = ({
  isOpen,
  onClose,
  onSubmit,
  assessmentData,
}) => {
  const [formData, setFormData] = useState({
    paperType: "paper1",
    form: assessmentData?.grade?.includes("4") ? "form4" : "form5",
    timeAllocation: "90",
    difficultyLevel: "Intermediate",
    // Paper 1 specific
    textSources: ["newspapers", "magazines", "advertisements"],
    readingLevel: assessmentData?.grade?.includes("4") ? "form4" : "form5",
    topics: ["people_culture", "science_technology"],
    questionTypes: {
      multipleChoiceOptions: 3,
      clozeTestFocus: "mixed",
      matchingComplexity: "moderate",
    },
    // Paper 2 specific
    communicationFormat: "email",
    essayTypes: ["descriptive", "narrative", "report"],
    topicCategories: ["people_culture", "health_environment"],
    promptComplexity: "moderate",
    // Common fields - specificTopic is now optional
    specificTopic: "",
    learningObjectives: "",
    examDescription: "",
    additionalRequirement: "",
  });

  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Validate form whenever formData changes
  React.useEffect(() => {
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

  // Removed handleArrayToggle - not currently used but kept for future enhancements
  // const handleArrayToggle = (field, value) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     [field]: prev[field].includes(value)
  //       ? prev[field].filter((item) => item !== value)
  //       : [...prev[field], value],
  //   }));
  // };

  const handleSubmit = async () => {
    // Enhanced validation for standalone SPM exams (specificTopic is now optional)
    const validation = validateSPMConfiguration(formData);
    if (!validation.isValid) {
      message.error("Please fix the validation errors before submitting");
      return;
    }

    // Paper-specific validations
    if (formData.paperType === "paper1") {
      if (formData.textSources.length === 0) {
        message.warning("Please select at least one text source for Paper 1");
        return;
      }
      if (formData.topics.length === 0) {
        message.warning(
          "Please select at least one topic category for Paper 1"
        );
        return;
      }
    }

    if (formData.paperType === "paper2") {
      if (formData.essayTypes.length === 0) {
        message.warning("Please select at least one essay type for Paper 2");
        return;
      }
      if (formData.topicCategories.length === 0) {
        message.warning(
          "Please select at least one topic category for Paper 2"
        );
        return;
      }
    }

    setLoading(true);
    try {
      // Enhanced data preparation for standalone SPM exam
      const submitData = {
        ...formData,
        ...assessmentData, // Include grade, subject, class info
        activityType: "smp-exam",
        isStandalone: true,
        assessmentTitle: generateAssessmentTitle(),
        assessmentDescription: generateAssessmentDescription(),
      };

      console.log("Submitting standalone SPM exam data:", submitData);

      await onSubmit(submitData);
      message.success("SPM exam settings submitted successfully!");
      onClose();
    } catch (error) {
      console.error("Submit error:", error);
      message.error("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate assessment title with fallback
  const generateAssessmentTitle = () => {
    const topicPart =
      formData.specificTopic ||
      (formData.paperType === "paper1"
        ? "Reading & Use of English"
        : "Writing");
    const paperTypePart =
      formData.paperType === "paper1" ? "Paper 1" : "Paper 2";

    return `${topicPart} - SPM ${paperTypePart} (${
      assessmentData?.grade || "Form 5"
    })`;
  };

  // Helper function to generate assessment description with fallback
  const generateAssessmentDescription = () => {
    if (formData.examDescription) {
      return formData.examDescription;
    }

    if (formData.learningObjectives) {
      return formData.learningObjectives;
    }

    const paperTypePart =
      formData.paperType === "paper1" ? "Reading & Use of English" : "Writing";

    const topicPart = formData.specificTopic
      ? ` focusing on ${formData.specificTopic}`
      : "";

    return `Standalone SPM ${paperTypePart} exam${topicPart}`;
  };

  const handleReset = () => {
    setFormData({
      paperType: "paper1",
      form: assessmentData?.grade?.includes("4") ? "form4" : "form5",
      timeAllocation: "90",
      difficultyLevel: "Intermediate",
      textSources: ["newspapers", "magazines", "advertisements"],
      readingLevel: assessmentData?.grade?.includes("4") ? "form4" : "form5",
      topics: ["people_culture", "science_technology"],
      questionTypes: {
        multipleChoiceOptions: 3,
        clozeTestFocus: "mixed",
        matchingComplexity: "moderate",
      },
      communicationFormat: "email",
      essayTypes: ["descriptive", "narrative", "report"],
      topicCategories: ["people_culture", "health_environment"],
      promptComplexity: "moderate",
      specificTopic: "",
      learningObjectives: "",
      examDescription: "",
      additionalRequirement: "",
    });
  };

  const getSelectedPaperDetails = () => {
    return paperTypes.find((paper) => paper.value === formData.paperType);
  };

  if (!isOpen) return null;

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
              <CalculatorOutlined />
            </div>
            <h3 className="modal-title">Create SPM English Exam</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Assessment Info Alert */}
          <Alert
            message="Standalone SPM Exam Creation"
            description={`Creating a standalone SPM English exam for ${
              assessmentData?.subject || "English"
            } - ${assessmentData?.grade || "Grade"} ${
              assessmentData?.className ? `(${assessmentData.className})` : ""
            }`}
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 24 }}
          />

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
            {/* Exam Topic & Objectives */}
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
                    <span>Exam Topic & Objectives</span>
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
                      Specific Topic (Optional)
                    </label>
                    <Input
                      placeholder="Enter a specific topic for this SPM exam (e.g., 'People and Culture - Malaysian Traditions')"
                      value={formData.specificTopic}
                      onChange={(e) =>
                        handleInputChange("specificTopic", e.target.value)
                      }
                      size="large"
                      maxLength={100}
                    />
                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "12px",
                        color: "#666",
                      }}
                    >
                      If left empty, a general topic based on your paper type
                      selection will be used
                    </div>
                  </Col>

                  <Col span={24} style={{ marginBottom: 16 }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: 500,
                      }}
                    >
                      Exam Description (Optional)
                    </label>
                    <TextArea
                      rows={3}
                      placeholder="Brief description of what this SPM exam covers"
                      value={formData.examDescription}
                      onChange={(e) =>
                        handleInputChange("examDescription", e.target.value)
                      }
                      maxLength={200}
                      showCount
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
                      placeholder="What specific learning outcomes should this SPM exam assess?"
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
                  <Col xs={24} sm={8}>
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

                  <Col xs={24} sm={8}>
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

                  <Col xs={24} sm={8}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: 500,
                      }}
                    >
                      Difficulty Level
                    </label>
                    <Select
                      value={formData.difficultyLevel}
                      onChange={(value) =>
                        handleInputChange("difficultyLevel", value)
                      }
                      style={{ width: "100%" }}
                      size="large"
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

                    <Row gutter={16} style={{ marginTop: 16 }}>
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
                  placeholder="Enter specific instructions, marking schemes, or special considerations for this standalone SPM exam..."
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
                    <span>SPM Exam Summary</span>
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
                    <Text>
                      {formData.specificTopic ||
                        "General Topic (Auto-generated)"}
                    </Text>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: "#666" }}>
                      Grade:
                    </Text>
                    <br />
                    <Tag color="purple">
                      {assessmentData?.grade || "General"}
                    </Tag>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: "#666" }}>
                      Subject:
                    </Text>
                    <br />
                    <Tag color="cyan">
                      {assessmentData?.subject || "English"}
                    </Tag>
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
                        <Tag color="gold">{formData.readingLevel}</Tag>
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
                        <Tag color="magenta">
                          {formData.communicationFormat}
                        </Tag>
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

                  <Col span={24}>
                    <Text strong style={{ color: "#666" }}>
                      Class:
                    </Text>
                    <br />
                    <Text>
                      {assessmentData?.className
                        ? `${assessmentData.className} - ${assessmentData.grade}`
                        : "Standalone Assessment"}
                    </Text>
                  </Col>

                  <Col span={24}>
                    <Text strong style={{ color: "#666" }}>
                      Generated Title:
                    </Text>
                    <br />
                    <Text style={{ fontStyle: "italic", color: "#1890ff" }}>
                      {generateAssessmentTitle()}
                    </Text>
                  </Col>
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
                validationErrors.length > 0 ? "disabled" : ""
              } ${loading ? "loading" : ""}`}
              onClick={handleSubmit}
              disabled={validationErrors.length > 0 || loading}
            >
              {loading ? (
                <>
                  <LoadingOutlined spin /> Creating...
                </>
              ) : (
                "📝 Create SPM Exam"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SPMExamStandaloneModal;
