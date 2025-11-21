// TextbookStandaloneModal.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Card, Input, Row, Col, message, Select, Alert, Tag } from "antd";
import {
  BookOutlined,
  EditOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import textbookService from "../../../services/textbookService";
import "./ModalStyles.css";
import { Typography } from "antd";

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

const TextbookStandaloneModal = ({
  isOpen,
  onClose,
  onSubmit,
  assessmentData,
}) => {
  const [formData, setFormData] = useState({
    selectedForm: assessmentData?.grade || "form4",
    selectedTopic: "",
    activityType: "",
    duration: "45 minutes",
    difficultyLevel: "intermediate",
    specificTopic: "",
    learningObjectives: "",
    textbookPages: "",
    exerciseType: "comprehension",
    additionalRequirement: "",
  });

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(false);

  // Enhanced form options for standalone textbook activities
  const forms = [
    { value: "form1", label: "Form 1" },
    { value: "form2", label: "Form 2" },
    { value: "form3", label: "Form 3" },
    { value: "form4", label: "Form 4" },
    { value: "form5", label: "Form 5" },
  ];

  const durationOptions = [
    { value: "30 minutes", label: "30 minutes" },
    { value: "45 minutes", label: "45 minutes" },
    { value: "60 minutes", label: "60 minutes" },
    { value: "90 minutes", label: "90 minutes" },
  ];

  const difficultyOptions = [
    { value: "Beginner", label: "Beginner", color: "#52c41a" },
    { value: "Intermediate", label: "Intermediate", color: "#fa8c16" },
    { value: "Advanced", label: "Advanced", color: "#f5222d" },
  ];

  const exerciseTypes = [
    {
      value: "comprehension",
      label: "Reading Comprehension",
      description: "Questions based on textbook passages",
    },
    {
      value: "vocabulary",
      label: "Vocabulary Exercises",
      description: "Word meanings and usage from textbook",
    },
    {
      value: "grammar",
      label: "Grammar Practice",
      description: "Grammar exercises from textbook lessons",
    },
    {
      value: "writing",
      label: "Writing Activities",
      description: "Writing tasks based on textbook themes",
    },
    {
      value: "discussion",
      label: "Discussion Questions",
      description: "Questions for class discussion",
    },
    {
      value: "project",
      label: "Project-Based Learning",
      description: "Extended projects using textbook content",
    },
  ];

  const englishActivityTypes = [
    {
      category: "Reading & Comprehension",
      activities: [
        "Reading Comprehension Questions",
        "Text Analysis",
        "Character Study",
        "Plot Summary",
        "Main Idea Identification",
        "Inference Questions",
        "Vocabulary in Context",
      ],
    },
    {
      category: "Language Skills",
      activities: [
        "Grammar Exercises",
        "Vocabulary Building",
        "Sentence Construction",
        "Tense Practice",
        "Parts of Speech",
        "Punctuation Practice",
        "Word Formation",
      ],
    },
    {
      category: "Writing Activities",
      activities: [
        "Guided Writing",
        "Creative Writing",
        "Summary Writing",
        "Letter Writing",
        "Diary Entry",
        "Story Continuation",
        "Descriptive Writing",
      ],
    },
    {
      category: "Speaking & Listening",
      activities: [
        "Role Play",
        "Dialogue Practice",
        "Pronunciation Practice",
        "Listening Comprehension",
        "Interview Practice",
        "Presentation Skills",
        "Group Discussion",
      ],
    },
  ];

  // Load initial form value from assessmentData
  useEffect(() => {
    if (assessmentData?.grade) {
      const gradeToForm = {
        "Form 1": "form1",
        "Form 2": "form2",
        "Form 3": "form3",
        "Form 4": "form4",
        "Form 5": "form5",
      };

      const formValue =
        gradeToForm[assessmentData.grade] ||
        assessmentData.grade.toLowerCase().replace(" ", "");
      setFormData((prev) => ({
        ...prev,
        selectedForm: formValue,
      }));
    }
  }, [assessmentData]);

  const fetchTopics = useCallback(async (form) => {
    setTopicsLoading(true);
    try {
      // Try to fetch from textbook service, with fallback to default topics
      let topicsData = [];

      try {
        const response = await textbookService.getTopicsByForm(form);
        if (response.success) {
          topicsData = response.topics || [];
        }
      } catch (error) {
        console.warn("Textbook service not available, using default topics");
      }

      // Fallback to default topics if service is not available
      if (topicsData.length === 0) {
        topicsData = getDefaultTopics(form);
      }

      setTopics(topicsData);
    } catch (error) {
      console.error("Error fetching topics:", error);
      message.warning(
        "Using default topics as textbook service is unavailable"
      );
      setTopics(getDefaultTopics(form));
    } finally {
      setTopicsLoading(false);
    }
  }, []);

  // Fetch topics when form is selected
  useEffect(() => {
    if (formData.selectedForm) {
      fetchTopics(formData.selectedForm);
    }
  }, [formData.selectedForm, fetchTopics]);

  // Default topics based on form level
  const getDefaultTopics = (form) => {
    const defaultTopics = {
      form1: [
        "Introduction to English",
        "Basic Grammar",
        "Simple Vocabulary",
        "Family and Friends",
        "School Life",
        "Hobbies and Interests",
      ],
      form2: [
        "Growing Up",
        "Nature and Environment",
        "Technology in Daily Life",
        "Cultural Diversity",
        "Health and Fitness",
        "Career Exploration",
      ],
      form3: [
        "Global Issues",
        "Literature Appreciation",
        "Scientific Discoveries",
        "Social Responsibility",
        "Communication Skills",
        "Critical Thinking",
      ],
      form4: [
        "People and Culture",
        "Science and Technology",
        "Consumer and Financial Awareness",
        "Sustainable Living",
        "Information Age",
        "Thinking Skills",
      ],
      form5: [
        "Personal Development",
        "Social Issues",
        "Environmental Awareness",
        "Globalization",
        "Innovation and Creativity",
        "Future Perspectives",
      ],
    };

    return defaultTopics[form] || defaultTopics.form4;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Reset topic when form changes
    if (field === "selectedForm") {
      setFormData((prev) => ({
        ...prev,
        selectedTopic: "",
      }));
    }
  };

  const handleSubmit = async () => {
    // Enhanced validation for standalone textbook activities
    if (
      !formData.selectedForm ||
      !formData.selectedTopic ||
      !formData.activityType
    ) {
      message.warning("Please fill in all required fields");
      return;
    }

    if (!formData.specificTopic.trim()) {
      message.warning("Please specify a topic for the textbook activity");
      return;
    }

    setLoading(true);
    try {
      // Enhanced data preparation for standalone textbook activity
      const submitData = {
        ...formData,
        ...assessmentData, // Include grade, subject, class info
        activityType: "textbook",
        isStandalone: true,
        assessmentTitle: `${formData.specificTopic} - Textbook Activity (${assessmentData.grade})`,
        assessmentDescription:
          formData.learningObjectives ||
          `Textbook-based activity for ${formData.specificTopic}`,
      };

      console.log("Submitting standalone textbook data:", submitData);

      await onSubmit(submitData);
      message.success("Textbook activity settings submitted successfully!");
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
      selectedForm: assessmentData?.grade || "form4",
      selectedTopic: "",
      activityType: "",
      duration: "45 minutes",
      difficultyLevel: "intermediate",
      specificTopic: "",
      learningObjectives: "",
      textbookPages: "",
      exerciseType: "comprehension",
      additionalRequirement: "",
    });
    setTopics([]);
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
              <BookOutlined />
            </div>
            <h3 className="modal-title">Create Textbook Activity</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Assessment Info Alert */}
          <Alert
            message="Standalone Textbook Activity"
            description={`Creating a textbook-based activity for ${
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
                      placeholder="Enter the specific topic for this activity (e.g., 'Reading Comprehension - Unit 3', 'Grammar - Present Tense')"
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
                      placeholder="What should students learn or achieve from this textbook activity?"
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

            {/* Form and Textbook Topic Selection */}
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
                        <span>Form Level</span>
                      </div>
                    }
                  >
                    <Select
                      placeholder="Choose a form (Form 1 - Form 5)"
                      value={formData.selectedForm}
                      onChange={(value) =>
                        handleInputChange("selectedForm", value)
                      }
                      style={{ width: "100%" }}
                      size="large"
                    >
                      {forms.map((form) => (
                        <Option key={form.value} value={form.value}>
                          {form.label}
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
                        <BookOutlined style={{ color: "#52c41a" }} />
                        <span>Textbook Topic</span>
                      </div>
                    }
                  >
                    <Select
                      placeholder={
                        formData.selectedForm
                          ? "Choose a topic from the textbook"
                          : "Please select a form first"
                      }
                      value={formData.selectedTopic}
                      onChange={(value) =>
                        handleInputChange("selectedTopic", value)
                      }
                      style={{ width: "100%" }}
                      size="large"
                      disabled={!formData.selectedForm}
                      loading={topicsLoading}
                      showSearch
                      filterOption={(input, option) =>
                        option.children
                          .toLowerCase()
                          .indexOf(input.toLowerCase()) >= 0
                      }
                    >
                      {topics.map((topic, index) => (
                        <Option key={index} value={topic}>
                          {topic}
                        </Option>
                      ))}
                    </Select>
                    {topics.length === 0 &&
                      formData.selectedForm &&
                      !topicsLoading && (
                        <Text
                          type="secondary"
                          style={{
                            fontSize: "12px",
                            display: "block",
                            marginTop: "8px",
                          }}
                        >
                          No topics found for the selected form
                        </Text>
                      )}
                  </Card>
                </Col>
              </Row>
            </Col>

            {/* Exercise Type and Activity Type */}
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
                        <FileTextOutlined style={{ color: "#722ed1" }} />
                        <span>Exercise Type</span>
                      </div>
                    }
                  >
                    <Select
                      value={formData.exerciseType}
                      onChange={(value) =>
                        handleInputChange("exerciseType", value)
                      }
                      style={{ width: "100%" }}
                      size="large"
                    >
                      {exerciseTypes.map((type) => (
                        <Option key={type.value} value={type.value}>
                          <div>
                            <div style={{ fontWeight: "500" }}>
                              {type.label}
                            </div>
                            <div style={{ fontSize: "12px", color: "#666" }}>
                              {type.description}
                            </div>
                          </div>
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
                        <BulbOutlined style={{ color: "#fa8c16" }} />
                        <span>Activity Type</span>
                      </div>
                    }
                  >
                    <Select
                      placeholder="Choose an activity type"
                      value={formData.activityType}
                      onChange={(value) =>
                        handleInputChange("activityType", value)
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
                      {englishActivityTypes.map((category) => (
                        <React.Fragment key={category.category}>
                          <Option
                            disabled
                            value={category.category}
                            style={{ fontWeight: "bold", color: "#1890ff" }}
                          >
                            {category.category}
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
                        </React.Fragment>
                      ))}
                    </Select>
                  </Card>
                </Col>
              </Row>
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
                      value={formData.duration}
                      onChange={(value) => handleInputChange("duration", value)}
                      style={{ width: "100%" }}
                      size="large"
                    >
                      {durationOptions.map((option) => (
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
                        <EditOutlined style={{ color: "#eb2f96" }} />
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
                      {difficultyOptions.map((level) => (
                        <Option key={level.value} value={level.value}>
                          <Tag
                            color={level.color}
                            style={{ marginRight: "8px" }}
                          >
                            {level.label}
                          </Tag>
                        </Option>
                      ))}
                    </Select>
                  </Card>
                </Col>
              </Row>
            </Col>

            {/* Textbook Pages */}
            <Col span={24}>
              <Card size="small" title="Textbook Reference (Optional)">
                <Input
                  placeholder="Enter textbook pages or chapter reference (e.g., 'Pages 45-52', 'Chapter 3')"
                  value={formData.textbookPages}
                  onChange={(e) =>
                    handleInputChange("textbookPages", e.target.value)
                  }
                  size="large"
                  maxLength={100}
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
                  placeholder="Enter specific instructions, materials needed, assessment criteria, or any special considerations for this standalone textbook activity..."
                  maxLength={400}
                  showCount
                />
              </Card>
            </Col>

            {/* Summary */}
            <Col span={24}>
              <Card
                size="small"
                title="Textbook Activity Summary"
                style={{ background: "#f6ffed", borderColor: "#b7eb8f" }}
              >
                <Row gutter={[16, 8]}>
                  <Col xs={24} sm={12} md={8}>
                    <div style={{ color: "#666", fontWeight: 600 }}>
                      Subject & Grade:
                    </div>
                    <div style={{ color: "#52c41a", fontWeight: 500 }}>
                      {assessmentData?.subject || "Subject"} -{" "}
                      {assessmentData?.grade || "Grade"}
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <div style={{ color: "#666", fontWeight: 600 }}>Topic:</div>
                    <div style={{ color: "#52c41a", fontWeight: 500 }}>
                      {formData.specificTopic || "Not specified"}
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <div style={{ color: "#666", fontWeight: 600 }}>
                      Form Level:
                    </div>
                    <div style={{ color: "#52c41a", fontWeight: 500 }}>
                      {forms.find((f) => f.value === formData.selectedForm)
                        ?.label || "Not selected"}
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <div style={{ color: "#666", fontWeight: 600 }}>
                      Textbook Topic:
                    </div>
                    <div style={{ color: "#52c41a", fontWeight: 500 }}>
                      {formData.selectedTopic || "Not selected"}
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <div style={{ color: "#666", fontWeight: 600 }}>
                      Exercise Type:
                    </div>
                    <div style={{ color: "#52c41a", fontWeight: 500 }}>
                      {exerciseTypes.find(
                        (e) => e.value === formData.exerciseType
                      )?.label || "Not selected"}
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <div style={{ color: "#666", fontWeight: 600 }}>
                      Activity Type:
                    </div>
                    <div style={{ color: "#52c41a", fontWeight: 500 }}>
                      {formData.activityType || "Not selected"}
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <div style={{ color: "#666", fontWeight: 600 }}>
                      Duration:
                    </div>
                    <div style={{ color: "#52c41a", fontWeight: 500 }}>
                      {formData.duration}
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <div style={{ color: "#666", fontWeight: 600 }}>
                      Difficulty:
                    </div>
                    <div style={{ color: "#52c41a", fontWeight: 500 }}>
                      {difficultyOptions.find(
                        (d) => d.value === formData.difficultyLevel
                      )?.label || "Intermediate"}
                    </div>
                  </Col>
                  {formData.textbookPages && (
                    <Col xs={24} sm={12} md={8}>
                      <div style={{ color: "#666", fontWeight: 600 }}>
                        Textbook Pages:
                      </div>
                      <div style={{ color: "#52c41a", fontWeight: 500 }}>
                        {formData.textbookPages}
                      </div>
                    </Col>
                  )}
                  {assessmentData?.className && (
                    <Col xs={24} sm={12} md={8}>
                      <div style={{ color: "#666", fontWeight: 600 }}>
                        Class:
                      </div>
                      <div style={{ color: "#52c41a", fontWeight: 500 }}>
                        {assessmentData.className}
                      </div>
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
              disabled={
                !formData.selectedForm ||
                !formData.selectedTopic ||
                !formData.activityType ||
                !formData.specificTopic.trim() ||
                loading
              }
            >
              {loading
                ? "⏳ Creating..."
                : "📚 Create Standalone Textbook Activity"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextbookStandaloneModal;
