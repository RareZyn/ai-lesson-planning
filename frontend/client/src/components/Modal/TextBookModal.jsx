import React, { useState } from "react";
import "./ModalStyles.css";

const TextBookModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    selectedTopic: "",
    activityType: "",
    additionalRequirement: "",
  });

  const topics = [
    "Topic 1: Family Ties",
    "Topic 2: Food, Food, Food!",
    "Topic 3: Wonders of Nature",
    "Topic 4: Special Relationships",
  ];

  const activityTypes = [
    "Reading Comprehension",
    "Listening Activity",
    "Speaking Task",
    "Writing Task",
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTopicSelect = (topic) => {
    handleInputChange("selectedTopic", topic);
  };

  const handleActivityTypeSelect = (type) => {
    handleInputChange("activityType", type);
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon" style={{ color: "#66bb6a" }}>
            📚
          </div>
          <h3>TextBook</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <h4>Topic</h4>
            <div className="dropdown-list">
              {topics.map((topic) => (
                <div
                  key={topic}
                  className={`dropdown-item ${
                    formData.selectedTopic === topic ? "selected" : ""
                  }`}
                  onClick={() => handleTopicSelect(topic)}
                >
                  {topic}
                </div>
              ))}
            </div>
          </div>

          <div className="modal-section">
            <h4>Activity Type</h4>
            <div className="dropdown-list">
              {activityTypes.map((type) => (
                <div
                  key={type}
                  className={`dropdown-item ${
                    formData.activityType === type ? "selected" : ""
                  }`}
                  onClick={() => handleActivityTypeSelect(type)}
                >
                  {type}
                </div>
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

export default TextBookModal;
