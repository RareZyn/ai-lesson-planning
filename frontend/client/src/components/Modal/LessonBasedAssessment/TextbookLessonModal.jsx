//TextBookModal.jsx with Loading Screen
import React, { useState } from "react";
import { Card, Input, Row, Col, message, Spin } from "antd";
import { BookOutlined, LoadingOutlined } from "@ant-design/icons";
import "./ModalStyles.css";

const { TextArea } = Input;

const TextBookLesson = ({ isOpen, onClose, onSubmit, selectedLessonPlan }) => {
  const [formData, setFormData] = useState({
    additionalRequirement: "",
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(formData);
      message.success("Textbook activity submitted successfully!");
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

  // Loading overlay when generating textbook activity
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
                Generating Textbook Activity
              </h3>
              <p
                style={{
                  color: "#666",
                  fontSize: "16px",
                  marginBottom: "16px",
                }}
              >
                Creating your textbook-based activity from the lesson plan...
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
                  📚 Aligning with curriculum standards
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
              <BookOutlined />
            </div>
            <h3 className="modal-title">English Textbook Activity</h3>
          </div>
          <button className="modal-close" onClick={onClose} disabled={loading}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Show lesson plan info if available */}
          {selectedLessonPlan && (
            <div
              style={{
                marginBottom: "24px",
                padding: "16px",
                background: "#f6ffed",
                borderRadius: "8px",
                border: "1px solid #b7eb8f",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  color: "#52c41a",
                  marginBottom: "4px",
                }}
              >
                Based on Lesson Plan:
              </div>
              <div style={{ fontSize: "16px", marginBottom: "4px" }}>
                {selectedLessonPlan.parameters?.specificTopic ||
                  "Selected Lesson"}
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                {selectedLessonPlan.parameters?.grade || "Form 4"} •
                {selectedLessonPlan.classId?.subject || "English"}
              </div>
            </div>
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
                  placeholder="Enter your requirements, instructions, or notes for this textbook activity..."
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
                  <strong>💡 Tip:</strong> Specify page numbers, exercises, or
                  specific textbook sections you'd like to focus on. The AI will
                  generate activities that complement your lesson objectives.
                </div>
              </Card>
            </Col>

            {/* Activity Preview */}
            <Col span={24}>
              <Card
                size="small"
                title="Activity Summary"
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
                  {selectedLessonPlan && (
                    <Col span={24}>
                      <div
                        style={{
                          color: "#666",
                          fontWeight: 600,
                          marginTop: "8px",
                        }}
                      >
                        Based on Lesson:
                      </div>
                      <div style={{ color: "#333" }}>
                        {selectedLessonPlan.parameters?.specificTopic ||
                          "Selected Lesson Plan"}
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
                  <LoadingOutlined spin /> Submitting...
                </>
              ) : (
                "📚 Submit Activity"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextBookLesson;
