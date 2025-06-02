import React, { useState } from "react";
import "./ModalStyles.css";

const EssayModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    essayType: "descriptive",
    wordCount: "100-200",
    additionalRequirement: "",
  });

  const essayTypes = [
    "Descriptive",
    "Narrative",
    "Expository",
    "Argumentative",
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEssayTypeSelect = (type) => {
    handleInputChange("essayType", type.toLowerCase());
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon" style={{ color: "#ffa726" }}>
            📄
          </div>
          <h3>Essay</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <h4>Essay Type</h4>
            <div className="dropdown-list">
              {essayTypes.map((type) => (
                <div
                  key={type}
                  className={`dropdown-item ${
                    formData.essayType === type.toLowerCase() ? "selected" : ""
                  }`}
                  onClick={() => handleEssayTypeSelect(type)}
                >
                  {type}
                </div>
              ))}
            </div>
          </div>

          <div className="modal-section">
            <h4>Expected Word Count</h4>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="wordCount"
                  value="100-200"
                  checked={formData.wordCount === "100-200"}
                  onChange={(e) =>
                    handleInputChange("wordCount", e.target.value)
                  }
                />
                <span>100 - 200</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="wordCount"
                  value="200-300"
                  checked={formData.wordCount === "200-300"}
                  onChange={(e) =>
                    handleInputChange("wordCount", e.target.value)
                  }
                />
                <span>200 - 300</span>
              </label>
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

export default EssayModal;
