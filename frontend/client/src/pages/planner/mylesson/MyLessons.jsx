import React, { useState, useEffect, useCallback } from 'react';
import './MyLessons.css'; // This will now mostly style the layout, not the card itself
import CalendarView from './CalendarView';
import LessonCard from '../displaylesson/LessonCard'; // Import the new card component
import { getAllLessonPlans } from '../../../services/lessonService';

const MyLessons = () => {
  const [mainTabValue, setMainTabValue] = useState(0);
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLessons = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedLessons = await getAllLessonPlans();
      setLessons(fetchedLessons);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mainTabValue === 1) { // Fetch data when "All Lessons" tab is selected
      fetchLessons();
    }
  }, [mainTabValue, fetchLessons]);

  const handleMainTabChange = (value) => {
    setMainTabValue(value);
  };
  
  const renderAllLessons = () => {
    if (isLoading) {
      return <div className="status-message">Loading your lessons...</div>;
    }
    if (error) {
      return <div className="status-message error">Error: {error}</div>;
    }
    if (lessons.length === 0) {
      return (
        <div className="status-message empty">
          <h3>No Lesson Plans Found</h3>
          <p>Create your first lesson plan from the Calendar tab!</p>
        </div>
      );
    }
    return (
      <div className="lessons-grid">
        {lessons.map((lesson) => (
          // Use the new LessonCard component
          <LessonCard key={lesson._id} lesson={lesson} />
        ))}
      </div>
    );
  };

  return (
    <div className="my-lessons-container">
      <h2 className="page-title">My Lessons</h2>
      <div className="tabs-container">
        <button
          className={`tab-button ${mainTabValue === 0 ? 'active' : ''}`}
          onClick={() => handleMainTabChange(0)}
        >
          Calendar
        </button>
        <button
          className={`tab-button ${mainTabValue === 1 ? 'active' : ''}`}
          onClick={() => handleMainTabChange(1)}
        >
          All Lessons
        </button>
      </div>

      <div className="tab-content">
        {mainTabValue === 0 && <CalendarView />}
        {mainTabValue === 1 && (
          <div className="all-lessons-view">
            {renderAllLessons()}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLessons;