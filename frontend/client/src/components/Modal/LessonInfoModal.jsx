// src/components/Modal/LessonInfoModal.jsx
import React from "react";
import { X, BookOpen } from "lucide-react";
import "./StandaloneAssessment/ModalStyles.css";
import "./LessonInfoModal.css";

const LessonInfoModal = ({ isOpen, onClose, lessonData }) => {
  if (!isOpen) return null;

  // Dummy data based on the modal design
  const dummyLessonData = {
    lesson: 1,
    lessonInSoV: 19,
    day: "Monday",
    subject: "English",
    theme: "People and Culture",
    topic: "Ready, Set, Go",
    time: "8:00-10:00",
    date: "1/4/2025",
    contentStandard: {
      main: "4.2 Communicate with appropriate language, form and style",
      component: "1.1 Understand meaning of variety of familiar context",
    },
    learningStandard: {
      main: "4.2.3 Produce a plan or draft of two paragraphs or more and modify this appropriately",
      component:
        "1.1.4 Understand independently longer sequences of classroom instruction",
    },
    iThink: "Tree Map",
    fourSkill: "Four Skill",
    writing: "Writing",
    cce: "CCE",
    gs: "GS",
    hots: "HOTS",
    create: "Create",
  };

  // Merge with lessonData if provided, ensuring nested objects exist
  const data = {
    ...dummyLessonData,
    ...lessonData,
    contentStandard: {
      ...dummyLessonData.contentStandard,
      ...(lessonData?.contentStandard || {}),
    },
    learningStandard: {
      ...dummyLessonData.learningStandard,
      ...(lessonData?.learningStandard || {}),
    },
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <BookOpen className="modal-icon" style={{ color: "#1976d2" }} />
          <h3>Lesson Info</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Basic Info Section */}
          <div className="lesson-info-grid">
            <div className="info-row">
              <div className="info-item">
                <label>Lesson</label>
                <div className="info-value">{data.lesson}</div>
              </div>
              <div className="info-item">
                <label>Lesson in SoV</label>
                <div className="info-value">{data.lessonInSoV}</div>
              </div>
              <div className="info-item">
                <label>Day</label>
                <div className="info-value">{data.day}</div>
              </div>
              <div className="info-item">
                <label>Subject</label>
                <div className="info-value">{data.subject}</div>
              </div>
            </div>

            <div className="info-row">
              <div className="info-item">
                <label>Theme</label>
                <div className="info-value">{data.theme}</div>
              </div>
              <div className="info-item">
                <label>Topic</label>
                <div className="info-value">{data.topic}</div>
              </div>
              <div className="info-item">
                <label>Time</label>
                <div className="info-value">{data.time}</div>
              </div>
              <div className="info-item">
                <label>Date</label>
                <div className="info-value">{data.date}</div>
              </div>
            </div>
          </div>

          {/* Content Standard Section */}
          <div className="modal-section">
            <h4>Content Standard</h4>
            <div className="standard-grid">
              <div className="standard-item">
                <label>Main</label>
                <div className="standard-value">
                  {data.contentStandard.main}
                </div>
              </div>
              <div className="standard-item">
                <label>Component</label>
                <div className="standard-value">
                  {data.contentStandard.component}
                </div>
              </div>
            </div>
          </div>

          {/* Learning Standard Section */}
          <div className="modal-section">
            <h4>Learning Standard</h4>
            <div className="standard-grid">
              <div className="standard-item">
                <label>Main</label>
                <div className="standard-value">
                  {data.learningStandard.main}
                </div>
              </div>
              <div className="standard-item">
                <label>Component</label>
                <div className="standard-value">
                  {data.learningStandard.component}
                </div>
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="modal-section">
            <div className="skills-grid">
              <div className="skill-item">
                <label>I-Think</label>
                <div className="skill-value">{data.iThink}</div>
              </div>
              <div className="skill-item">
                <label>Four Skill</label>
                <div className="skill-value">{data.fourSkill}</div>
              </div>
              <div className="skill-item">
                <label>Writing</label>
                <div className="skill-value">{data.writing}</div>
              </div>
              <div className="skill-item">
                <label>CCE</label>
                <div className="skill-value">{data.cce}</div>
              </div>
              <div className="skill-item">
                <label>GS</label>
                <div className="skill-value">{data.gs}</div>
              </div>
              <div className="skill-item">
                <label>HOTS</label>
                <div className="skill-value">{data.hots}</div>
              </div>
              <div className="skill-item">
                <label>Create</label>
                <div className="skill-value">{data.create}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonInfoModal;
