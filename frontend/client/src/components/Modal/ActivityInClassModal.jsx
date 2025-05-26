import React, { useState } from "react";
import "./ModalStyles.css";

const ActivityInClassModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    studentArrangement: "collaborative",
    resourceUsage: "external",
    bloomTaxonomy: [],
    additionalRequirement: "",
  });

  const bloomLevels = ["Remember", "Understand", "Apply", "Analyze"];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBloomTaxonomyToggle = (level) => {
    setFormData((prev) => ({
      ...prev,
      bloomTaxonomy: prev.bloomTaxonomy.includes(level)
        ? prev.bloomTaxonomy.filter((l) => l !== level)
        : [...prev.bloomTaxonomy, level],
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
          <div className="modal-icon" style={{ color: "#ff4757" }}>
            ⚡
          </div>
          <h3>Activity in Class</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <h4>Student Arrangement:</h4>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="studentArrangement"
                  value="collaborative"
                  checked={formData.studentArrangement === "collaborative"}
                  onChange={(e) =>
                    handleInputChange("studentArrangement", e.target.value)
                  }
                />
                <span>Collaborative Group Work</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="studentArrangement"
                  value="individual"
                  checked={formData.studentArrangement === "individual"}
                  onChange={(e) =>
                    handleInputChange("studentArrangement", e.target.value)
                  }
                />
                <span>Individual Student Work</span>
              </label>
            </div>
          </div>

          <div className="modal-section">
            <h4>Resource Usage:</h4>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="resourceUsage"
                  value="external"
                  checked={formData.resourceUsage === "external"}
                  onChange={(e) =>
                    handleInputChange("resourceUsage", e.target.value)
                  }
                />
                <span>Utilize External Resources</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="resourceUsage"
                  value="classroom"
                  checked={formData.resourceUsage === "classroom"}
                  onChange={(e) =>
                    handleInputChange("resourceUsage", e.target.value)
                  }
                />
                <span>Classroom-Available Resources Only</span>
              </label>
            </div>
          </div>

          <div className="modal-section">
            <h4>Bloom Taxonomy</h4>
            <div className="bloom-taxonomy">
              {bloomLevels.map((level) => (
                <div
                  key={level}
                  className={`bloom-level ${
                    formData.bloomTaxonomy.includes(level) ? "selected" : ""
                  }`}
                  onClick={() => handleBloomTaxonomyToggle(level)}
                >
                  {level}
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

export default ActivityInClassModal;
