import React, { useState, useEffect, useCallback } from 'react';
import styles from './PlannerPage.module.css'; // Use CSS Modules for scoped styles
import CalendarView from './CalendarView';
import LessonCard from '../displaylesson/LessonCard';
import MaterialManagement from '../../material/MaterialManagement'; // Import the new component
import { getAllLessonPlans } from '../../../services/lessonService';
import { useNavigate } from 'react-router-dom';

const PlannerPage = () => {
  // Use strings for tab identifiers for better readability
  const [activeTab, setActiveTab] = useState('lessons'); 
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchLessons = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedLessons = await getAllLessonPlans();
      setLessons(fetchedLessons);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch data only when the "My Lessons" tab is active
    if (activeTab === 'lessons') {
      fetchLessons();
    }
  }, [activeTab, fetchLessons]);

  const renderAllLessons = () => {
    if (isLoading) return <div className={styles.statusMessage}>Loading your lessons...</div>;
    if (error) return <div className={styles.statusMessage_error}>{error}</div>;
    if (lessons.length === 0) {
      return (
        <div className={styles.statusMessage_empty}>
          <h3>No Lesson Plans Found</h3>
          <p>Create your first lesson plan from the Calendar tab!</p>
          <button className={styles.createButton} onClick={() => setActiveTab('calendar')}>Go to Calendar</button>
        </div>
      );
    }
    return (
      <div className={styles.lessonsGrid}>
        {lessons.map((lesson) => (
          <LessonCard key={lesson._id} lesson={lesson} />
        ))}
      </div>
    );
  };
  
  const tabs = [
    { id: 'lessons', label: 'My Lessons' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'materials', label: 'Materials' },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.tabsContainer}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className={styles.tabContent}>
        {activeTab === 'lessons' && renderAllLessons()}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'materials' && <MaterialManagement />}
      </main>
    </div>
  );
};

export default PlannerPage;