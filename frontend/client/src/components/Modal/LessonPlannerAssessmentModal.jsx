// src/components/Modal/LessonPlannerAssessmentModal.jsx
import React, { useState } from "react";
import {
  Card,
  Select,
  Button,
  Input,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  Tooltip,
  Divider,
  message,
  InputNumber,
  Checkbox,
  Alert,
} from "antd";
import {
  FileTextOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  BookOutlined,
  EditOutlined,
  CheckCircleOutlined,
  BulbOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  englishForms,
  englishAssessmentTypes,
  questionTypes,
  englishSkills,
  difficultyLevels,
  timeAllocation,
  literatureComponents,
} from "../../data/englishAssessmentTypes";
import "./ModalStyles.css";

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

const LessonPlannerAssessmentModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    selectedLessonPlan: "",
    assessmentType: "",
    questionTypes: [],
    skills: [],
    difficultyLevel: "intermediate",
    numberOfQuestions: 20,
    timeAllocation: "60",
    includeInstructions: true,
    includeAnswerKey: true,
    literatureComponent: "",
    specificTopic: "",
    additionalRequirement: "",
  });

  const [loading, setLoading] = useState(false);

  // Dummy lesson plans data
  const lessonPlans = [
    {
      id: "684da7f4b96de6d12b6b124e",
      title: "Making our school community safer",
      class: "5 Anggerik",
      grade: "Form 5",
      subject: "English",
      theme: "People and Culture",
      topic: "It's Personal!",
      focus: "evaluate",
      proficiencyLevel: "B1 Mid",
      learningObjective: "Students will be able to evaluate the effectiveness of different safety measures in creating a safer school community.",
      date: "2025-06-08",
    },
    {
      id: "684da7f4b96de6d12b6b125f",
      title: "An informal email to a friend about a celebrity I admire",
      class: "5 UM",
      grade: "Form 5",
      subject: "English",
      theme: "People and Culture",
      topic: "It's Personal!",
      focus: "create",
      proficiencyLevel: "B1 High",
      learningObjective: "By the end of the lesson, students will be able to write a multi-paragraph informal email, using appropriate structure, tone, and descriptive language to express admiration for a famous person.",
      date: "2025-06-10",
    },
    {
      id: "684da7f4b96de6d12b6b126g",
      title: "Understanding different text types and their purposes",
      class: "Biruni",
      grade: "Form 5",
      subject: "English",
      theme: "Science and Technology",
      topic: "Tomorrow's World",
      focus: "understand",
      proficiencyLevel: "B1 Low",
      learningObjective: "Students will be able to identify different text types and understand their specific purposes and language features.",
      date: "2025-06-15",
    },
  ];

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
    if (!formData.selectedLessonPlan) {
      message.warning("Please select a lesson plan");
      return;
    }

    if (!formData.assessmentType) {
      message.warning("Please select an assessment type");
      return;
    }

    if (formData.questionTypes.length === 0) {
      message.warning("Please select at least one question type");
      return;
    }

    if (formData.skills.length === 0) {
      message.warning("Please select at least one English skill to assess");
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
      selectedLessonPlan: "",
      assessmentType: "",
      questionTypes: [],
      skills: [],
      difficultyLevel: "intermediate",
      numberOfQuestions: 20,
      timeAllocation: "60",
      includeInstructions: true,
      includeAnswerKey: true,
      literatureComponent: "",
      specificTopic: "",
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

  const getSelectedLessonPlan = () => {
    return lessonPlans.find((plan) => plan.id === formData.selectedLessonPlan);
  };

  const getSkillColor = (skill) => {
    const skillObj = englishSkills.find((s) => s.value === skill);
    return skillObj ? skillObj.color : "#1890ff";
  };

  const getSkillIcon = (skill) => {
    const skillObj = englishSkills.find((s) => s.value === skill);
    return skillObj ? skillObj.icon : "📝";
  };

  if (!isOpen) return null;

  const selectedPlan = getSelectedLessonPlan();

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
              <FileTextOutlined />
            </div>
            <h3 className="modal-title">Assessment from Lesson Planner</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <Alert
            message="Create Assessment Based on Lesson Plan"
            description="Select an existing lesson plan to generate a targeted assessment that aligns with your teaching objectives and learning outcomes."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Row gutter={[16, 24]}>
            {/* Lesson Plan Selection */}
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
                    <BookOutlined style={{ color: "#1890ff" }} />
                    <span>Select Lesson Plan</span>
                  </div>
                }
              >
                <Select
                  placeholder="Choose a lesson plan to base the assessment on"
                  value={formData.selectedLessonPlan}
                  onChange={(value) => handleInputChange("selectedLessonPlan", value)}
                  style={{ width: "100%" }}
                  size="large"
                  showSearch
                  filterOption={(input, option) =>
                    option.children.props.children[0].props.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {lessonPlans.map((plan) => (
                    <Option key={plan.id} value={plan.id}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{plan.title}</div>
                        <div style={{ fontSize: "12px", color: "#8c8c8c" }}>
                          {plan.class} • {plan.grade} • {plan.theme} • {plan.date}
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>

                {/* Selected Lesson Plan Preview */}
                {selectedPlan && (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "16px",
                      background: "#f6ffed",
                      borderRadius: "8px",
                      border: "1px solid #b7eb8f",
                    }}
                  >
                    <Text strong style={{ color: "#52c41a" }}>
                      Selected Lesson Plan:
                    </Text>
                    <div style={{ marginTop: "8px" }}>
                      <div style={{ fontWeight: 600, marginBottom: "8px" }}>
                        {selectedPlan.title}
                      </div>
                      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                        <Tag color="blue">{selectedPlan.class}</Tag>
                        <Tag color="green">{selectedPlan.grade}</Tag>
                        <Tag color="purple">{selectedPlan.focus.toUpperCase()}</Tag>
                        <Tag color="orange">{selectedPlan.proficiencyLevel}</Tag>
                      </div>
                      <div style={{ color: "#666", fontSize: "13px" }}>
                        <strong>Theme:</strong> {selectedPlan.theme} | <strong>Topic:</strong> {selectedPlan.topic}
                      </div>
                      <div style={{ 
                        color: "#666", 
                        fontSize: "13px", 
                        marginTop: "8px",
                        padding: "8px",
                        background: "white",
                        borderRadius: "4px",
                        border: "1px solid #d9d9d9"
                      }}>
                        <strong>Learning Objective:</strong> {selectedPlan.learningObjective}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </Col>

            {/* Assessment Configuration - Only show if lesson plan is selected */}
            {selectedPlan && (
              <>
                {/* Assessment Type & Difficulty */}
                <Col span={24}>
                  <Row gutter={16}>
                    <Col xs={24} sm={16}>
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

                    <Col xs={24} sm={8}>
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
                      </Card>
                    </Col>
                  </Row>
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

                {/* English Skills */}
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
                        <SettingOutlined style={{ color: "#722ed1" }} />
                        <span>English Skills to Assess</span>
                      </div>
                    }
                  >
                    <Row gutter={[12, 12]}>
                      {englishSkills.map((skill) => (
                        <Col xs={12} sm={8} md={6} key={skill.value}>
                          <div
                            onClick={() => handleArrayToggle("skills", skill.value)}
                            style={{
                              padding: "10px",
                              border: `2px solid ${
                                formData.skills.includes(skill.value)
                                  ? skill.color
                                  : "#d9d9d9"
                              }`,
                              borderRadius: "6px",
                              cursor: "pointer",
                              background: formData.skills.includes(skill.value)
                                ? `${skill.color}15`
                                : "white",
                              transition: "all 0.2s ease",
                              textAlign: "center",
                              position: "relative",
                            }}
                          >
                            {formData.skills.includes(skill.value) && (
                              <CheckCircleOutlined
                                style={{
                                  position: "absolute",
                                  top: "4px",
                                  right: "4px",
                                  color: skill.color,
                                }}
                              />
                            )}
                            <div style={{ fontSize: "18px", marginBottom: "4px" }}>
                              {skill.icon}
                            </div>
                            <div
                              style={{
                                fontWeight: "500",
                                fontSize: "12px",
                                color: formData.skills.includes(skill.value)
                                  ? skill.color
                                  : "#666",
                              }}
                            >
                              {skill.label}
                            </div>
                          </div>
                        </Col>
                      ))}
                    </Row>

                    {formData.skills.length > 0 && (
                      <div style={{ marginTop: "16px" }}>
                        <Text strong>Selected Skills: </Text>
                        <Space wrap>
                          {formData.skills.map((skill) => (
                            <Tag
                              key={skill}
                              color={getSkillColor(skill)}
                              closable
                              onClose={() => handleArrayToggle("skills", skill)}
                            >
                              {getSkillIcon(skill)}{" "}
                              {englishSkills.find((s) => s.value === skill)?.label}
                            </Tag>
                          ))}
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
                              <Text
                                type="secondary"
                                style={{ fontSize: "12px", display: "block" }}
                              >
                                {time.description}
                              </Text>
                            </Option>
                          ))}
                        </Select>
                      </Card>
                    </Col>
                  </Row>
                </Col>

                {/* Literature Component (Optional) */}
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
                        <BookOutlined style={{ color: "#fadb14" }} />
                        <span>Literature Component (Optional)</span>
                      </div>
                    }
                  >
                    <Select
                      placeholder="Select if assessment includes literature"
                      value={formData.literatureComponent}
                      onChange={(value) =>
                        handleInputChange("literatureComponent", value)
                      }
                      style={{ width: "100%" }}
                      size="large"
                      allowClear
                    >
                      {literatureComponents.map((component) => (
                        <Option key={component.value} value={component.value}>
                          <div>
                            <div style={{ fontWeight: "500" }}>
                              {component.label}
                            </div>
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              {component.description}
                            </Text>
                          </div>
                        </Option>
                      ))}
                    </Select>
                  </Card>
                </Col>

                {/* Additional Options */}
                <Col span={24}>
                  <Card size="small" title="Additional Options">
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Checkbox
                        checked={formData.includeInstructions}
                        onChange={(e) =>
                          handleInputChange("includeInstructions", e.target.checked)
                        }
                      >
                        Include detailed instructions for students
                      </Checkbox>
                      <Checkbox
                        checked={formData.includeAnswerKey}
                        onChange={(e) =>
                          handleInputChange("includeAnswerKey", e.target.checked)
                        }
                      >
                        Generate answer key/marking scheme
                      </Checkbox>
                    </Space>
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
                      placeholder="Enter specific instructions, learning objectives, marking criteria, or any special considerations for this assessment..."
                      maxLength={500}
                      showCount
                    />
                  </Card>
                </Col>

                {/* Assessment Preview Summary */}
                {(formData.assessmentType ||
                  formData.questionTypes.length > 0 ||
                  formData.skills.length > 0) && (
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
                            Based on Lesson:
                          </Text>
                          <br />
                          <Text>{selectedPlan?.title}</Text>
                        </Col>
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
                            Difficulty:
                          </Text>
                          <br />
                          <Tag
                            color={
                              difficultyLevels.find(
                                (d) => d.value === formData.difficultyLevel
                              )?.color
                            }
                          >
                            {
                              difficultyLevels.find(
                                (d) => d.value === formData.difficultyLevel
                              )?.label
                            }
                          </Tag>
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
                        <Col xs={24} sm={12} md={6}>
                          <Text strong style={{ color: "#666" }}>
                            Skills:
                          </Text>
                          <br />
                          <Text>{formData.skills.length} skills selected</Text>
                        </Col>
                        {formData.literatureComponent && (
                          <Col xs={24} sm={12} md={6}>
                            <Text strong style={{ color: "#666" }}>
                              Literature:
                            </Text>
                            <br />
                            <Text>
                              {
                                literatureComponents.find(
                                  (l) => l.value === formData.literatureComponent
                                )?.label
                              }
                            </Text>
                          </Col>
                        )}
                      </Row>

                      <div style={{ marginTop: "12px" }}>
                        <Text strong style={{ color: "#666" }}>
                          Options:{" "}
                        </Text>
                        <Space>
                          {formData.includeInstructions && (
                            <Tag color="blue">📋 Instructions</Tag>
                          )}
                          {formData.includeAnswerKey && (
                            <Tag color="green">🔑 Answer Key</Tag>
                          )}
                        </Space>
                      </div>
                    </Card>
                  </Col>
                )}
              </>
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
                !formData.selectedLessonPlan ||
                !formData.assessmentType ||
                formData.questionTypes.length === 0 ||
                formData.skills.length === 0 ||
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

export default LessonPlannerAssessmentModal;