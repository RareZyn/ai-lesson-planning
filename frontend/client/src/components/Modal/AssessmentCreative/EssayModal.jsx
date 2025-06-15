import React, { useState } from "react";
import { Select, Input } from "antd";
import "./ModalStyles.css";

const { Option } = Select;
const { TextArea } = Input;

const EssayModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    essayType: "short_communicative",
    format: "",
    purpose: "",
    theme: "",
    extendedType: "",
    topic: "",
    points: "",
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
      onClose();
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      essayType: "short_communicative",
      format: "",
      purpose: "",
      theme: "",
      extendedType: "",
      topic: "",
      points: "",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Standardized Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon">📝</div>
            <h3 className="modal-title">Select Essay Details</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Essay Type */}
          <div className="modal-section">
            <h4>Essay Type</h4>
            <Select
              value={formData.essayType}
              onChange={(value) => handleInputChange("essayType", value)}
              className="w-100"
              size="large"
              style={{ width: "100%" }}
            >
              <Option value="short_communicative">
                Short Communicative Message
              </Option>
              <Option value="guided">Guided Writing</Option>
              <Option value="extended">Extended Writing</Option>
            </Select>
          </div>

          {/* Short Communicative Fields */}
          {formData.essayType === "short_communicative" && (
            <>
              <div className="modal-section">
                <h4>Format</h4>
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
              </div>

              <div className="modal-section">
                <h4>Purpose</h4>
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
              </div>
            </>
          )}

          {/* Guided Writing Fields */}
          {formData.essayType === "guided" && (
            <>
              <div className="modal-section">
                <h4>Theme</h4>
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
              </div>

              <div className="modal-section">
                <h4>Key Points</h4>
                <TextArea
                  rows={4}
                  placeholder="List 3–4 points here..."
                  value={formData.points}
                  onChange={(e) => handleInputChange("points", e.target.value)}
                  maxLength={200}
                  showCount
                />
              </div>
            </>
          )}

          {/* Extended Writing Fields */}
          {formData.essayType === "extended" && (
            <>
              <div className="modal-section">
                <h4>Extended Type</h4>
                <Select
                  value={formData.extendedType}
                  onChange={(value) => handleInputChange("extendedType", value)}
                  style={{ width: "100%" }}
                  size="large"
                  placeholder="Select type..."
                >
                  <Option value="review">⭐ Review</Option>
                  <Option value="article">📰 Article</Option>
                  <Option value="report">📊 Report</Option>
                  <Option value="story">📚 Story</Option>
                </Select>
              </div>

              <div className="modal-section">
                <h4>Topic</h4>
                <Input
                  placeholder="Enter topic"
                  value={formData.topic}
                  onChange={(e) => handleInputChange("topic", e.target.value)}
                  size="large"
                />
              </div>

              <div className="modal-section">
                <h4>Key Points / Guidelines</h4>
                <TextArea
                  rows={4}
                  placeholder="Add elaboration, evidence or points"
                  value={formData.points}
                  onChange={(e) => handleInputChange("points", e.target.value)}
                  maxLength={300}
                  showCount
                />
              </div>
            </>
          )}
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
              {loading ? "⏳ Generating..." : "✨ Generate Essay"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EssayModal;
