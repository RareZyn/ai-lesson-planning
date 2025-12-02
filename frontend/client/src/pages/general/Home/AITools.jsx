import React from "react";
import { useNavigate } from "react-router-dom";
import "./AITools.css";

const AITools = () => {
  const navigate = useNavigate();

  const tools = [
    {
      id: "lesson-plans",
      title: "Lesson Plans",
      icon: "/logo/lessonIcon.webp",
      path: "lessons",
    },
    {
      id: "activities",
      title: "Assessment",
      icon: "/logo/choose.webp",
      path: "assessment",
    },
    {
      id: "answer-checker",
      title: "Answer Checker",
      icon: "/logo/survey.webp",
      path: "submissions",
    },
    {
      id: "offline-mode",
      title: "Offline Mode",
      icon: "/logo/folders.webp",
      path: "offline-mode",
    },
    {
      id: "materials",
      title: "Materials",
      icon: "/logo/lessonIcon.webp",
      path: "materials",
    },
    {
      id: "analytics",
      title: "Analytics",
      icon: "/logo/graph.webp",
      path: "analytics",
    },
  ];

  const handleToolClick = (path) => {
    navigate(path);
  };

  return (
    <div className="ai-tools-container">
      <h3 className="topic">Teaching Tools</h3>
      <div className="tools-grid">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className="tool-card"
            onClick={() => handleToolClick(tool.path)}
          >
            <div className="tool-icon">
              <img src={tool.icon} alt={tool.title} />
            </div>
            <div className="tool-title">{tool.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AITools;
