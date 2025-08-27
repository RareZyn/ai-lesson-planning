//TextbookLessonModal.jsx 
import React, { useState, useEffect } from "react";
import { Card, Input, Row, Col, message, Spin, Alert } from "antd";
import { BookOutlined, LoadingOutlined, RedoOutlined } from "@ant-design/icons";
import "./ModalStyles.css";

const { TextArea } = Input;

const TextBookLesson = ({
  isOpen,
  onClose,
  onSubmit,
  selectedLessonPlan,
  isLessonPlanningMode = false, // Flag to indicate lesson planning mode
  existingConfiguration = null, // Existing configuration data
  isRegenerateMode = false, // NEW: Flag for regeneration mode
  existingAssessment = null, // NEW: Existing assessment data
}) => {
  const [formData, setFormData] = useState({
    additionalRequirement: "",
  });

  const [loading, setLoading] = useState(false);

  // Load existing configuration if available
  useEffect(() => {
    if (existingConfiguration) {
      setFormData({
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
    // Basic validation - textbook activities are generally less restrictive
    // but we can add validation if needed in the future

    setLoading(true);
    try {
      let submitData;

      if (isLessonPlanningMode) {
        // For lesson planning mode, return configuration data
        submitData = {
          ...formData,
          configuredFor: "textbook", // Identifier for the configuration type
        };

        await onSubmit(submitData);
        message.success("Textbook configuration saved successfully!");
      } else if (isRegenerateMode) {
        // NEW: For regeneration mode, submit new configuration
        submitData = {
          ...formData,
          activityType: "textbook",
          isRegeneration: true,
          existingAssessmentId: existingAssessment?._id,
        };

        await onSubmit(submitData);
        // Success message will be handled by parent component
      } else {
        // For assessment generation mode (existing functionality)
        submitData = {
          ...formData,
          activityType: "textbook",
        };
        await onSubmit(submitData);
        message.success("Textbook settings submitted successfully!");
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
      additionalRequirement: "",
    });
  };

  if (!isOpen) return null;

  // Loading overlay when generating/regenerating textbook activity
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
                  ? "Regenerating Textbook Activity"
                  : "Generating Textbook Activity"}
              </h3>
              <p
                style={{
                  color: "#666",
                  fontSize: "16px",
                  marginBottom: "16px",
                }}
              >
                {isLessonPlanningMode
                  ? "Saving your textbook activity configuration for the lesson plan..."
                  : isRegenerateMode
                  ? "Regenerating your textbook activity with new settings..."
                  : "Creating your textbook-based activity from the lesson plan..."}
              </p>
              <div
                style={{
                  background: "#f0f8ff",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #d4edda",
                }}
              >
                <div style={{ fontSize: "14px", color: "#666" }}>
                  {isLessonPlanningMode
                    ? "📚 Configuring textbook activity parameters"
                    : isRegenerateMode
                    ? "📚 Updating textbook activity with new configuration"
                    : "📚 Aligning with curriculum standards"}
                </div>
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
        style={{ maxWidth: "600px" }}
      >
        {/* Standardized Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon">
              {isRegenerateMode ? <RedoOutlined /> : <BookOutlined />}
            </div>
            <h3 className="modal-title">
              {isLessonPlanningMode
                ? "Configure English Textbook Activity"
                : isRegenerateMode
                ? "Regenerate English Textbook Activity"
                : "English Textbook Activity"}
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
              message="Configure Textbook Activity"
              description="Set up the parameters for your textbook-based activity. This configuration will be saved with your lesson plan and used when generating assessments later."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          {isRegenerateMode && (
            <Alert
              message="Regenerate Textbook Assessment"
              description={`Update the settings for "${selectedLessonPlan?.title}" textbook assessment. The existing assessment will be replaced with a new one based on your updated configuration.`}
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
              } Lesson Plan: ${
                selectedLessonPlan.parameters?.specificTopic ||
                selectedLessonPlan.title ||
                "Selected Lesson"
              }`}
              description={`${
                isRegenerateMode ? "Update" : "Generate"
              } textbook-based activity for: ${
                selectedLessonPlan.classId?.className ||
                selectedLessonPlan.class ||
                "Class"
              } | ${
                selectedLessonPlan.parameters?.grade ||
                selectedLessonPlan.classId?.grade ||
                "Grade"
              } | English`}
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          <Row gutter={[16, 24]}>
            {/* Additional Requirements */}
            <Col span={24}>
              <Card size="small" title="Activity Requirements & Instructions">
                <TextArea
                  rows={6}
                  value={formData.additionalRequirement}
                  onChange={(e) =>
                    handleInputChange("additionalRequirement", e.target.value)
                  }
                  placeholder={
                    isLessonPlanningMode
                      ? "Enter your requirements, instructions, or notes for this textbook activity. This will be used when generating assessments based on this lesson plan..."
                      : isRegenerateMode
                      ? "Update requirements, instructions, or notes for the regenerated textbook activity..."
                      : "Enter your requirements, instructions, or notes for this textbook activity..."
                  }
                  maxLength={500}
                  showCount
                  disabled={loading}
                />

                {/* Helper text */}
                <div
                  style={{
                    marginTop: "12px",
                    padding: "8px 12px",
                    background: "#f0f8ff",
                    borderRadius: "4px",
                    fontSize: "12px",
                    color: "#666",
                  }}
                >
                  <strong>💡 Tip:</strong>
                  {isLessonPlanningMode
                    ? " Specify page numbers, exercises, or specific textbook sections you'd like to focus on. This configuration will be saved and used when generating assessments later."
                    : isRegenerateMode
                    ? " Update page numbers, exercises, or specific textbook sections you'd like to focus on for the regenerated activity."
                    : " Specify page numbers, exercises, or specific textbook sections you'd like to focus on. The AI will generate activities that complement your lesson objectives."}
                </div>
              </Card>
            </Col>

            {/* Activity Preview */}
            <Col span={24}>
              <Card
                size="small"
                title={`Textbook Activity ${
                  isRegenerateMode ? "Regeneration" : ""
                } Summary`}
                style={{ background: "#f6ffed", borderColor: "#b7eb8f" }}
              >
                <Row gutter={[16, 8]}>
                  <Col xs={24} sm={12}>
                    <div style={{ color: "#666", fontWeight: 600 }}>
                      Activity Type:
                    </div>
                    <div style={{ color: "#52c41a", fontWeight: 500 }}>
                      📚 Textbook-Based Activity
                    </div>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div style={{ color: "#666", fontWeight: 600 }}>
                      Resource Required:
                    </div>
                    <div style={{ color: "#52c41a", fontWeight: 500 }}>
                      English Textbook
                    </div>
                  </Col>
                  {!isLessonPlanningMode && selectedLessonPlan && (
                    <Col span={24}>
                      <div
                        style={{
                          color: "#666",
                          fontWeight: 600,
                          marginTop: "8px",
                        }}
                      >
                        {isRegenerateMode ? "Updating" : "Based on"} Lesson:
                      </div>
                      <div style={{ color: "#333" }}>
                        {selectedLessonPlan.parameters?.specificTopic ||
                          selectedLessonPlan.title ||
                          "Selected Lesson Plan"}
                      </div>
                    </Col>
                  )}
                  {isLessonPlanningMode && (
                    <Col span={24}>
                      <div
                        style={{
                          color: "#666",
                          fontWeight: 600,
                          marginTop: "8px",
                        }}
                      >
                        Configuration Mode:
                      </div>
                      <div style={{ color: "#333" }}>
                        This configuration will be saved with your lesson plan
                      </div>
                    </Col>
                  )}
                  {isRegenerateMode && (
                    <Col span={24}>
                      <div
                        style={{
                          color: "#666",
                          fontWeight: 600,
                          marginTop: "8px",
                        }}
                      >
                        Regeneration Mode:
                      </div>
                      <div style={{ color: "#fa8c16" }}>
                        The existing assessment will be replaced with new
                        content
                      </div>
                    </Col>
                  )}
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
                  {isLessonPlanningMode
                    ? "Saving..."
                    : isRegenerateMode
                    ? "Regenerating..."
                    : "Generating..."}
                </>
              ) : isLessonPlanningMode ? (
                "📝 Save Configuration"
              ) : isRegenerateMode ? (
                "🔄 Regenerate Assessment"
              ) : (
                "📝 Generate Assessment"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextBookLesson;
