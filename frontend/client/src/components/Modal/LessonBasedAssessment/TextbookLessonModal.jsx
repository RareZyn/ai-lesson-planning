//TextBookModal.jsxaccording to lesson planner
import React, { useState } from "react";
import { Card, Input, Row, Col, message } from "antd";
import { BookOutlined } from "@ant-design/icons";
import "./ModalStyles.css";

const { TextArea } = Input;

const TextBookLesson = ({ isOpen, onClose, onSubmit }) => {
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
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
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
                />
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
              {loading ? "⏳ Submitting..." : "📚 Submit Activity"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextBookLesson;
