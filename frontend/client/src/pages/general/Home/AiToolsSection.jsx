import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MenuBook,        // Lesson Plans
  CalendarToday,   // Calendar
  LibraryBooks,    // Materials
  Brush,          // Activities
  CloudDownload,  // Downloads
  CheckCircle     // Checker
} from '@mui/icons-material';
import './AiToolsSection.css';

const AiToolsSection = () => {
  const navigate = useNavigate();

  const tools = [
    {
      id: 1,
      title: 'Lesson Plans',
      icon: <MenuBook fontSize="large" />,
      path: '/lesson-plan-generator'
    },
    {
      id: 2,
      title: 'Calendar',
      icon: <CalendarToday fontSize="large" />,
      path: '/calendar'
    },
    {
      id: 3,
      title: 'Materials',
      icon: <LibraryBooks fontSize="large" />,
      path: '/material-generator'
    },
    {
      id: 4,
      title: 'Activities',
      icon: <Brush fontSize="large" />,
      path: '/activity-generator'
    },
    {
      id: 5,
      title: 'Downloads',
      icon: <CloudDownload fontSize="large" />,
      path: '/file-download'
    },
    {
      id: 6,
      title: 'Checker',
      icon: <CheckCircle fontSize="large" />,
      path: '/answer-checker'
    }
  ];

  return (
    <div className="ai-tools-container">
      <h2 className="section-title">AI Teaching Tools</h2>
      <div className="tools-grid">
        {tools.map((tool) => (
          <div 
            key={tool.id}
            className="tool-item"
            onClick={() => navigate(tool.path)}
          >
            <div className="tool-circle">
              <span className="tool-icon">{tool.icon}</span>
            </div>
            <div className="tool-title">{tool.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AiToolsSection;