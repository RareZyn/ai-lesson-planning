import React, { useState } from "react";
import "./ModalStyles.css";

const AssessmentModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    numberOfQuestions: "10",
    difficultyLevel: "easy",
    questionTypes: [],
    additionalRequirement: "",
  });

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

  const handleSubmit = () => {
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon" style={{ color: "#42a5f5" }}>
            📋
          </div>
          <h3>Assessment</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <h4>Number of Question</h4>
            <input
              type="number"
              className="number-input"
              value={formData.numberOfQuestions}
              onChange={(e) =>
                handleInputChange("numberOfQuestions", e.target.value)
              }
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
            <h4>Additional Requirement:</h4>
            <textarea
              rows="3"
              value={formData.additionalRequirement}
              onChange={(e) =>
                handleInputChange("additionalRequirement", e.target.value)
              }
              placeholder="Enter your suggestion here"
              className="modal-textarea"
            />
            <div className="char-count">
              {formData.additionalRequirement.length} / 100
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-submit" onClick={handleSubmit}>
            SUBMIT
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentModal;
