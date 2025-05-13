import React, { useState } from 'react';
import './MyLessons.css';
import CalendarView from './CalendarView'; // Import the CalendarView component

const MyLessons = () => {
  const [mainTabValue, setMainTabValue] = useState(0);
  const [calendarView, setCalendarView] = useState('week');

  // Sample data for lessons
  // TODO change to prop
  const lessons = [
    { id: 1, title: 'Mathematics Basics', date: '2023-06-15', time: '10:00 AM' },
    { id: 2, title: 'Advanced Physics', date: '2023-06-16', time: '2:00 PM' },
    { id: 3, title: 'Literature Review', date: '2023-06-17', time: '9:00 AM' },
  ];

  const handleMainTabChange = (value) => {
    setMainTabValue(value);
  };

  const handleCalendarViewChange = (value) => {
    setCalendarView(value);
  };

  return (
    <div className="my-lessons-container">
      <h2 style={{ textAlign: "left" }}>My Lessons</h2>
      {/* Main Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-button ${mainTabValue === 0 ? 'active' : ''}`}
          onClick={() => handleMainTabChange(0)}
        >
          <h4>Calendar</h4>
        </button>
        <button
          className={`tab-button ${mainTabValue === 1 ? 'active' : ''}`}
          onClick={() => handleMainTabChange(1)}
        >
          <h4>All Lessons</h4>
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {mainTabValue === 0 && (
          <CalendarView />
        )}

        {mainTabValue === 1 && (
          <div className="all-lessons-view">
            <div className="lessons-grid">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="lesson-card">
                  <h3 className="lesson-title">{lesson.title}</h3>
                  <p className="lesson-meta">{lesson.date} at {lesson.time}</p>
                  <p className="lesson-description">Lesson description placeholder text goes here.</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLessons;
