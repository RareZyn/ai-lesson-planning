import React, { useState } from "react";
import "./AssessmentForm.css";
import ActivityInClassModal from "../../components/Modal/ActivityInClassModal";
import TextBookModal from "../../components/Modal/TextBookModal";
import EssayModal from "../../components/Modal/EssayModal";
import AssessmentModal from "../../components/Modal/AssesstmentModal";

const AssessmentForm = () => {
  const [formData, setFormData] = useState({
    lesson: "1",
    lessonInSow: "19",
    day: "Monday",
    subject: "English",
    theme: "People and Culture",
    topic: "Ready, Set, Go",
    time: "8:00-10:00",
    date: "1/4/2025",
    contentStandard: {
      main: "4.2 Communicate with appropriate language, form and style",
      component: "1.1 Understand meaning in a variety of familiar contexts",
    },
    learningStandard: {
      main: "4.2.3 Produce a plan or draft of two paragraphs or more and modify this appropriately independently",
      component:
        "1.1.4 Understand independently longer sequences of classroom instructions",
    },
    learningStandards: {
      iThink: "Tree Map",
      fourSkill: "Four Skill",
      writing: "Writing",
      cce: "CCE",
      gs: "GS",
      hots: "HOTS",
      create: "Create",
    },
    preActivity:
      "Students will be introduced to the topic through a warm-up discussion about cultural differences and similarities.",
    activity:
      "Students will work in collaborative groups to analyze different cultural practices and create presentations using appropriate language forms.",
    postActivity:
      "Groups will present their findings and participate in a reflective discussion about cultural understanding.",
    objective:
      "Students will be able to communicate effectively about cultural topics using appropriate language forms and demonstrate understanding of diverse perspectives.",
    successCriteria:
      "Students can identify key cultural elements, use appropriate vocabulary, and engage respectfully in cultural discussions.",
  });

  const [activeModal, setActiveModal] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleStandardChange = (standardType, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [standardType]: {
        ...prev[standardType],
        [field]: value,
      },
    }));
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const handleSave = () => {
    // Here you can call your backend API
    console.log("Saving data:", formData);
    setIsEditMode(false);
    // Add your backend save logic here
  };

  const handleGenerate = () => {
    // Here you can call your AI generation API
    console.log("Generating activity details...");
    setIsGenerated(true);
    // Add your AI generation logic here
    // This will populate the Generated Activity Details section
  };

  const handleReset = () => {
    // Reset the generated state and clear generated content if needed
    setIsGenerated(false);
    console.log("Resetting form...");
    // Add reset logic here
  };

  const openModal = (modalType) => {
    console.log("Opening modal:", modalType);
    setActiveModal(modalType);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const handleModalSubmit = (modalType, data) => {
    console.log(`${modalType} data:`, data);
    closeModal();
  };

  const activityFormats = [
    { id: "activity-in-class",label: "Activity in Class",icon: "⚡",color: "#ff4757",},
    { id: "essay", label: "Essay", icon: "📄", color: "#ffa726" },
    { id: "textbook", label: "TextBook", icon: "📚", color: "#66bb6a" },
    { id: "assessment", label: "Assessment", icon: "📋", color: "#42a5f5" },
  ];

  return (
    <div className="assessment-form">
      {/* Header */}
      <div className="assessment-header">
        <h2>Assessment</h2>
        <div className="header-buttons">
          <button
            className={`edit-btn ${isEditMode ? "active" : ""}`}
            onClick={toggleEditMode}
          >
            {isEditMode ? "Cancel" : "Edit"}
          </button>
          {isEditMode && (
            <button className="save-btn" onClick={handleSave}>
              Save
            </button>
          )}
        </div>
      </div>

      {/* Section 1: Basic Info */}
      <div className="assessment-section basic-info">
        <h3 className="section-title">5 Anggerik</h3>
        <div className="info-grid">
          <div className="info-row">
            {["lesson", "lessonInSow", "day", "subject"].map((key) => (
              <div className="info-item" key={key}>
                <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                <input
                  type="text"
                  value={formData[key]}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  readOnly={!isEditMode}
                  className={!isEditMode ? "readonly" : ""}
                />
              </div>
            ))}
          </div>
          <div className="info-row">
            {["theme", "topic", "time", "date"].map((key) => (
              <div className="info-item" key={key}>
                <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                <input
                  type="text"
                  value={formData[key]}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  readOnly={!isEditMode}
                  className={!isEditMode ? "readonly" : ""}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Standards Section - Corrected Structure */}
        <div className="standards-section">
          {/* Content Standard */}
          <div className="standards-header">
            <h4>Content Standard</h4>
          </div>
          <div className="standard-row">
            <div className="standard-item">
              <label>Main</label>
              <input
                type="text"
                value={formData.contentStandard.main}
                onChange={(e) =>
                  handleStandardChange(
                    "contentStandard",
                    "main",
                    e.target.value
                  )
                }
                readOnly={!isEditMode}
                className={!isEditMode ? "readonly" : ""}
              />
            </div>
            <div className="standard-item">
              <label>Comp.</label>
              <input
                type="text"
                value={formData.contentStandard.component}
                onChange={(e) =>
                  handleStandardChange(
                    "contentStandard",
                    "component",
                    e.target.value
                  )
                }
                readOnly={!isEditMode}
                className={!isEditMode ? "readonly" : ""}
              />
            </div>
          </div>

          {/* Learning Standard */}
          <div className="standards-header">
            <h4>Learning Standard</h4>
          </div>
          <div className="standard-row">
            <div className="standard-item">
              <label>Main</label>
              <input
                type="text"
                value={formData.learningStandard.main}
                onChange={(e) =>
                  handleStandardChange(
                    "learningStandard",
                    "main",
                    e.target.value
                  )
                }
                readOnly={!isEditMode}
                className={!isEditMode ? "readonly" : ""}
              />
            </div>
            <div className="standard-item">
              <label>Comp.</label>
              <input
                type="text"
                value={formData.learningStandard.component}
                onChange={(e) =>
                  handleStandardChange(
                    "learningStandard",
                    "component",
                    e.target.value
                  )
                }
                readOnly={!isEditMode}
                className={!isEditMode ? "readonly" : ""}
              />
            </div>
          </div>

          {/* Learning Standards Info */}
          <div className="standards-header">
            <h4>Info</h4>
          </div>
          <div className="learning-standards-grid">
            {Object.keys(formData.learningStandards).map((key) => (
              <div className="learning-item" key={key}>
                <label>{key.toUpperCase()}</label>
                <input
                  type="text"
                  value={formData.learningStandards[key]}
                  onChange={(e) =>
                    handleInputChange("learningStandards", {
                      ...formData.learningStandards,
                      [key]: e.target.value,
                    })
                  }
                  readOnly={!isEditMode}
                  className={!isEditMode ? "readonly" : ""}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: Format Picker */}
      <div className="assessment-section generator-section">
        <h3 className="section-title">AI-powered Assessment Generator</h3>
        <div className="format-preferences">
          <h4>Activity Format Preferences</h4>
          <p>Please select your preferred option for each category:</p>
          <div className="format-grid">
            {activityFormats.map((format) => (
              <div
                key={format.id}
                className="format-card"
                onClick={() => openModal(format.id)}
              >
                <div className="format-icon" style={{ color: format.color }}>
                  {format.icon}
                </div>
                <span className="format-label">{format.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3: Generated Output */}
      <div className="assessment-section activity-section">
        <h3 className="section-title">Generated Activity Details</h3>
        {[
          "preActivity",
          "activity",
          "postActivity",
          "objective",
          "successCriteria",
        ].map((key) => (
          <div className="field-group" key={key}>
            <label>{key.replace(/([A-Z])/g, " $1")}:</label>
            <div className="generated-content">{formData[key]}</div>
          </div>
        ))}

        {/* Buttons */}
        <div className="action-buttons">
          {isGenerated && (
            <>
              <button className="btn btn-assessment">
                <span className="btn-icon">📋</span> Assessment
              </button>
              <button className="btn btn-rubric">
                <span className="btn-icon">👁</span> Rubric
              </button>
            </>
          )}
          <button
            className="btn btn-generate main-btn"
            onClick={handleGenerate}
          >
            <span className="btn-icon">⭐</span> Generate
          </button>
          <button className="btn btn-reset" onClick={handleReset}>
            <span className="btn-icon">🔄</span> Reset
          </button>
        </div>
      </div>

      {/* Render Modals */}
      {activeModal === "activity-in-class" && (
        <ActivityInClassModal
          isOpen={true}
          onClose={closeModal}
          onSubmit={(data) => handleModalSubmit("activity-in-class", data)}
        />
      )}
      {activeModal === "essay" && (
        <EssayModal
          isOpen={true}
          onClose={closeModal}
          onSubmit={(data) => handleModalSubmit("essay", data)}
        />
      )}
      {activeModal === "textbook" && (
        <TextBookModal
          isOpen={true}
          onClose={closeModal}
          onSubmit={(data) => handleModalSubmit("textbook", data)}
        />
      )}
      {activeModal === "assessment" && (
        <AssessmentModal
          isOpen={true}
          onClose={closeModal}
          onSubmit={(data) => handleModalSubmit("assessment", data)}
        />
      )}
    </div>
  );
};

export default AssessmentForm;
