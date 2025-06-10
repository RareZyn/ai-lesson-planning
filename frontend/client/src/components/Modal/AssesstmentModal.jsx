import React, { useState } from "react";
import "./ModalStyles.css";

const AssessmentModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    numberOfQuestions: "10",
    difficultyLevel: "easy",
    questionTypes: [],
    additionalRequirement: "",
  });

  const [loading, setLoading] = useState(false);

  const questionTypes = [
    "Any type",
    "Subjective",
    "Multiple Choice",
    "Exam Form",
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleQuestionTypeToggle = (type) => {
    setFormData((prev) => ({
      ...prev,
      questionTypes: prev.questionTypes.includes(type)
        ? prev.questionTypes.filter((t) => t !== type)
        : [...prev.questionTypes, type],
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
      numberOfQuestions: "10",
      difficultyLevel: "easy",
      questionTypes: [],
      additionalRequirement: "",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Standardized Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon" style={{ color: "#42a5f5" }}>
              📋
            </div>
            <h3 className="modal-title">Assessment</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="modal-section">
            <h4>Number of Questions</h4>
            <input
              type="number"
              className="number-input"
              value={formData.numberOfQuestions}
              onChange={(e) =>
                handleInputChange("numberOfQuestions", e.target.value)
              }
              min="1"
              max="50"
            />
          </div>

          <div className="modal-section">
            <h4>Difficulty Level</h4>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="difficultyLevel"
                  value="easy"
                  checked={formData.difficultyLevel === "easy"}
                  onChange={(e) =>
                    handleInputChange("difficultyLevel", e.target.value)
                  }
                />
                <span>Easy</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="difficultyLevel"
                  value="medium"
                  checked={formData.difficultyLevel === "medium"}
                  onChange={(e) =>
                    handleInputChange("difficultyLevel", e.target.value)
                  }
                />
                <span>Medium</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="difficultyLevel"
                  value="hard"
                  checked={formData.difficultyLevel === "hard"}
                  onChange={(e) =>
                    handleInputChange("difficultyLevel", e.target.value)
                  }
                />
                <span>Hard</span>
              </label>
            </div>
          </div>

          <div className="modal-section">
            <h4>Question Type</h4>
            <div className="checkbox-group horizontal">
              {questionTypes.map((type) => (
                <label key={type} className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={formData.questionTypes.includes(type)}
                    onChange={() => handleQuestionTypeToggle(type)}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="modal-section">
            <h4>Additional Requirements</h4>
            <textarea
              rows="3"
              value={formData.additionalRequirement}
              onChange={(e) =>
                handleInputChange("additionalRequirement", e.target.value)
              }
              placeholder="Enter your suggestions here"
              className="modal-textarea"
              maxLength={100}
            />
            <div className="char-count">
              {formData.additionalRequirement.length} / 100
            </div>
          </div>
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
              {loading ? "⏳ Submitting..." : "📝 Generate Assessment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentModal;
