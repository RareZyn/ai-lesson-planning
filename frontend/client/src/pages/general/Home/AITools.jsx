import React from "react";
import { useNavigate } from "react-router-dom";
import "./AITools.css";

const AITools = () => {
  const navigate = useNavigate();


  const tools = [
    {
      id: "lesson-plans",
      title: "Lesson Plans",
      icon: "/logo/lessonIcon.png",
      path: "lessons",
    },
    {
      id: "activities",
      title: "Assessment",
      icon: "/logo/choose.png",
      path: "assessment",
    },
    {
      id: "answer-checker",
      title: "Answer Checker",
      icon: "/logo/survey.png",
      path: "answer-checker",
    },
    {
      id: "downloads",
      title: "Downloads",
      icon: "/logo/folders.png",
      path: "downloads",
    },
    {
      id: "calendar",
      title: "Calendar",
      icon: "/logo/schedule.png",
      path: "/calendar",
    },
    {
      id: "materials",
      title: "Materials",
      icon: "/logo/lessonIcon.png",
      path: "materials",
    },
    {
      id: "graph",
      title: "Graph",
      icon: "/logo/graph.png",
      path: "graph",
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
