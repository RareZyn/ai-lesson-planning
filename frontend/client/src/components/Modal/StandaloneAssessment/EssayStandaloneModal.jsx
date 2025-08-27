// EssayStandaloneModal.jsx - Enhanced standalone essay modal
import React, { useState } from "react";
import { Card, Input, Row, Col, message, Select, Alert } from "antd";
import {
  BookOutlined,
  EditOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import "./ModalStyles.css";

const { TextArea } = Input;
const { Option } = Select;

const EssayStandaloneModal = ({
  isOpen,
  onClose,
  onSubmit,
  assessmentData,
}) => {
  const [formData, setFormData] = useState({
    essayType: "descriptive",
    wordCount: "200-300 words",
    duration: "60 minutes",
    specificTopic: "",
    essayPrompt: "",
    learningObjectives: "",
    writingFocus: "creativity",
    additionalRequirement: "",
  });

  const [loading, setLoading] = useState(false);

  const essayTypes = [
    {
      value: "descriptive",
      label: "Descriptive Essay",
      description: "Describe people, places, or things in detail",
    },
    {
      value: "narrative",
      label: "Narrative Essay",
      description: "Tell a story with characters and plot",
    },
    {
      value: "expository",
      label: "Expository Essay",
      description: "Explain or inform about a topic",
    },
    {
      value: "persuasive",
      label: "Persuasive Essay",
      description: "Convince readers of a particular viewpoint",
    },
    {
      value: "argumentative",
      label: "Argumentative Essay",
      description: "Present evidence-based arguments",
    },
    {
      value: "compare_contrast",
      label: "Compare & Contrast Essay",
      description: "Examine similarities and differences",
    },
    {
      value: "creative",
      label: "Creative Writing",
      description: "Original creative expression",
    },
    {
      value: "personal_reflection",
      label: "Personal Reflection",
      description: "Share personal thoughts and experiences",
    },
  ];

  const wordCountOptions = [
    { value: "100-150 words", label: "100-150 words" },
    { value: "150-200 words", label: "150-200 words" },
    { value: "200-300 words", label: "200-300 words" },
    { value: "300-400 words", label: "300-400 words" },
    { value: "400-500 words", label: "400-500 words" },
    { value: "500+ words", label: "500+ words" },
  ];

  const durationOptions = [
    { value: "30 minutes", label: "30 minutes" },
    { value: "45 minutes", label: "45 minutes" },
    { value: "60 minutes", label: "60 minutes" },
    { value: "90 minutes", label: "90 minutes" },
    { value: "120 minutes", label: "120 minutes" },
  ];

  const writingFocusOptions = [
    {
      value: "creativity",
      label: "Creativity & Imagination",
      description: "Focus on creative expression",
    },
    {
      value: "structure",
      label: "Structure & Organization",
      description: "Emphasize essay structure",
    },
    {
      value: "language",
      label: "Language & Vocabulary",
      description: "Develop rich language use",
    },
    {
      value: "critical_thinking",
      label: "Critical Thinking",
      description: "Develop analytical skills",
    },
    {
      value: "personal_voice",
      label: "Personal Voice",
      description: "Encourage individual expression",
    },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    // Enhanced validation for standalone essays
    if (!formData.essayType) {
      message.warning("Please select an essay type");
      return;
    }

    if (!formData.specificTopic.trim()) {
      message.warning("Please specify a topic for the essay");
      return;
    }

    if (!formData.essayPrompt.trim()) {
      message.warning("Please provide an essay prompt or question");
      return;
    }

    setLoading(true);
    try {
      // Enhanced data preparation for standalone essay
      const submitData = {
        ...formData,
        ...assessmentData, // Include grade, subject, class info
        activityType: "essay",
        isStandalone: true,
        assessmentTitle: `${formData.specificTopic} - ${
          essayTypes.find((t) => t.value === formData.essayType)?.label
        } (${assessmentData.grade})`,
        assessmentDescription:
          formData.learningObjectives ||
          `${formData.essayType} essay writing assessment for ${formData.specificTopic}`,
      };

      console.log("Submitting standalone essay data:", submitData);

      await onSubmit(submitData);
      message.success("Essay settings submitted successfully!");
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
      specificTopic: "",
      essayPrompt: "",
      learningObjectives: "",
      writingFocus: "creativity",
      additionalRequirement: "",
    });
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
              <EditOutlined />
            </div>
            <h3 className="modal-title">Create Essay Writing Assessment</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Assessment Info Alert */}
          <Alert
            message="Standalone Essay Assessment"
            description={`Creating an essay writing assessment for ${
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
            {/* Topic and Prompt */}
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
                    <FileTextOutlined style={{ color: "#fa8c16" }} />
                    <span>Essay Topic & Prompt</span>
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
                      placeholder="Enter the essay topic (e.g., 'My Dream Vacation', 'Environmental Conservation')"
                      value={formData.specificTopic}
                      onChange={(e) =>
                        handleInputChange("specificTopic", e.target.value)
                      }
                      size="large"
                      maxLength={100}
                    />
                  </Col>
                  <Col span={24} style={{ marginBottom: 16 }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: 500,
                      }}
                    >
                      Essay Prompt/Question *
                    </label>
                    <TextArea
                      rows={3}
                      placeholder="Write the essay prompt or question that students will respond to..."
                      value={formData.essayPrompt}
                      onChange={(e) =>
                        handleInputChange("essayPrompt", e.target.value)
                      }
                      maxLength={300}
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
                      rows={2}
                      placeholder="What writing skills should students demonstrate through this essay?"
                      value={formData.learningObjectives}
                      onChange={(e) =>
                        handleInputChange("learningObjectives", e.target.value)
                      }
                      maxLength={200}
                      showCount
                    />
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Essay Type and Focus */}
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
                        <span>Essay Type</span>
                      </div>
                    }
                  >
                    <Select
                      placeholder="Choose essay type"
                      value={formData.essayType}
                      onChange={(value) =>
                        handleInputChange("essayType", value)
                      }
                      style={{ width: "100%" }}
                      size="large"
                    >
                      {essayTypes.map((type) => (
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
                        <BookOutlined style={{ color: "#52c41a" }} />
                        <span>Writing Focus</span>
                      </div>
                    }
                  >
                    <Select
                      value={formData.writingFocus}
                      onChange={(value) =>
                        handleInputChange("writingFocus", value)
                      }
                      style={{ width: "100%" }}
                      size="large"
                    >
                      {writingFocusOptions.map((focus) => (
                        <Option key={focus.value} value={focus.value}>
                          <div>
                            <div style={{ fontWeight: "500" }}>
                              {focus.label}
                            </div>
                            <div style={{ fontSize: "12px", color: "#666" }}>
                              {focus.description}
                            </div>
                          </div>
                        </Option>
                      ))}
                    </Select>
                  </Card>
                </Col>
              </Row>
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
                  placeholder="Enter specific writing guidelines, assessment criteria, resources to include, or any special instructions for this essay..."
                  maxLength={400}
                  showCount
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
                      Essay Type:
                    </div>
                    <div style={{ color: "#52c41a", fontWeight: 500 }}>
                      {essayTypes.find((t) => t.value === formData.essayType)
                        ?.label || "Not selected"}
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <div style={{ color: "#666", fontWeight: 600 }}>
                      Word Count:
                    </div>
                    <div style={{ color: "#52c41a", fontWeight: 500 }}>
                      {formData.wordCount}
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
                      Writing Focus:
                    </div>
                    <div style={{ color: "#52c41a", fontWeight: 500 }}>
                      {writingFocusOptions.find(
                        (f) => f.value === formData.writingFocus
                      )?.label || "Not selected"}
                    </div>
                  </Col>
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
                  {formData.essayPrompt && (
                    <Col span={24}>
                      <div
                        style={{
                          color: "#666",
                          fontWeight: 600,
                          marginTop: "8px",
                        }}
                      >
                        Essay Prompt:
                      </div>
                      <div
                        style={{
                          color: "#333",
                          fontStyle: "italic",
                          marginTop: "4px",
                        }}
                      >
                        "{formData.essayPrompt}"
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
                !formData.essayType ||
                !formData.specificTopic.trim() ||
                !formData.essayPrompt.trim() ||
                loading
              }
            >
              {loading
                ? "⏳ Creating..."
                : "📝 Create Standalone Essay Assessment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EssayStandaloneModal;
