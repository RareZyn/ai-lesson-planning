import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './CalendarView.css'; // Using your original CSS file
import { getAllLessonPlans } from '../../../services/lessonService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const daysOfWeek = ['Su.', 'Mo.', 'Tu.', 'We.', 'Th.', 'Fr.', 'Sa.'];

const CalendarView = () => {
  const [selectedView, setSelectedView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();

  // State for fetched lesson plan data
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all lesson plans when the component mounts
  const fetchAllLessons = useCallback(async () => {
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
    fetchAllLessons();
  }, [fetchAllLessons]);

  // --- Mobile Detection ---
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Modal State for Mobile ---
  const [dayModalVisible, setDayModalVisible] = useState(false);
  const [selectedDayLessons, setSelectedDayLessons] = useState([]);
  const [selectedDayDate, setSelectedDayDate] = useState(null);

  const handleDayClick = (date, dayLessons) => {
    if (dayLessons.length > 0) {
      // If there are lessons, show detail modal on mobile
      if (isMobile) {
        setSelectedDayDate(date);
        setSelectedDayLessons(dayLessons);
        setDayModalVisible(true);
      } else {
        // On desktop, clicking the empty space creates a lesson, pills are clickable separately
        handleCreateLesson(date);
      }
    } else {
      // No lessons, create new
      handleCreateLesson(date);
    }
  };

  const handleMobileCreateFromModal = () => {
    if (selectedDayDate) {
      handleCreateLesson(selectedDayDate);
      setDayModalVisible(false);
    }
  };

  // --- Helper Functions ---
  const handleCreateLesson = (dateForLesson) => {
    navigate('/app/planner', { state: { selectedDate: dateForLesson.toISOString() } });
  };

  const handleNavigateLesson = (lessonId) => {
    navigate(`/app/lessons/${lessonId}`);
  };

  const changeDate = (offset) => {
    const newDate = new Date(currentDate);
    if (selectedView === 'week') {
      newDate.setDate(currentDate.getDate() + offset * 7);
    } else if (selectedView === 'month') {
      newDate.setMonth(currentDate.getMonth() + offset);
    }
    setCurrentDate(newDate);
  };

  // --- Data Processing for Grids ---
  const getLessonsForDay = (day) => {
    return lessons.filter(lesson =>
      new Date(lesson.lessonDate).toDateString() === day.toDateString()
    );
  };

  const getMonthGridDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysArray = [];
    let dayCounter = 1 - firstDay;

    for (let i = 0; i < 42; i++) { // 6 rows * 7 days
      const date = new Date(year, month, dayCounter);
      daysArray.push({
        date: date,
        label: date.getMonth() === month ? date.getDate() : '',
        isToday: date.toDateString() === new Date().toDateString(),
        lessons: date.getMonth() === month ? getLessonsForDay(date) : []
      });
      dayCounter++;
    }
    return daysArray;
  };

  const getWeekGridDays = () => {
    const week = [];
    const day = new Date(currentDate);
    const startOfWeek = day.getDate() - day.getDay();

    for (let i = 0; i < 7; i++) {
      const date = new Date(day.setDate(startOfWeek + i));
      week.push({
        day: daysOfWeek[date.getDay()],
        dateStr: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`,
        isToday: date.toDateString() === new Date().toDateString(),
        fullDate: date,
        lessons: getLessonsForDay(date)
      });
    }
    return week;
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button className="today-btn" onClick={() => setCurrentDate(new Date())}>Today</button>
        <div className="calendar-nav">
          <button onClick={() => changeDate(-1)}>{'<'}</button>
          <h2>{currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}</h2>
          <button onClick={() => changeDate(1)}>{'>'}</button>
        </div>
        <div className="view-toggle">
          <button
            className={selectedView === 'week' ? 'active' : ''}
            onClick={() => setSelectedView('week')}
          >
            Week
          </button>
          <button
            className={selectedView === 'month' ? 'active' : ''}
            onClick={() => setSelectedView('month')}
          >
            Month
          </button>
        </div>
      </div>

      {isLoading && <LoadingSpinner tip="Loading lessons..." />}
      {error && <p className="error-message">Error: {error}</p>}

      {!isLoading && !error && selectedView === 'week' && (
        <div className="week-grid">
          {getWeekGridDays().map((d, index) => (
            <div className="day-column" key={index}>
              <div className={`day-header ${d.isToday ? 'today' : ''}`}>
                {d.day} {d.dateStr}
              </div>
              <div className="create-lesson">
                <button className="create-btn" onClick={() => handleCreateLesson(d.fullDate)}>
                  + Create lesson
                </button>
              </div>
              <div className="day-lessons">
                {d.lessons.map((lesson) => (
                  <div key={lesson._id} className="lesson-pill" onClick={() => handleNavigateLesson(lesson._id)}>
                    {lesson.parameters.specificTopic}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && selectedView === 'month' && (
        <div className="month-view-wrapper">
          <div className="month-days-header">
            {daysOfWeek.map((day, i) => (
              <div className="month-day-label" key={i}>{day}</div>
            ))}
          </div>
          <div className="month-grid">
            {getMonthGridDays().map((d, i) => (
              <div
                className={`month-cell ${d.label ? 'active-day' : ''}`}
                key={i}
                onClick={d.label ? () => handleDayClick(d.date, d.lessons) : undefined}
              >
                <div className={`month-date ${d.isToday ? 'today' : ''}`}>
                  {d.label}
                </div>

                {/* Desktop View: Show Pills */}
                {!isMobile && (
                  <div className="month-lessons">
                    {d.lessons.map((lesson) => (
                      <div
                        key={lesson._id}
                        className="lesson-pill"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigateLesson(lesson._id);
                        }}
                      >
                        {lesson.parameters.specificTopic}
                      </div>
                    ))}
                  </div>
                )}

                {/* Mobile View: Show Count Badge */}
                {isMobile && d.lessons.length > 0 && (
                  <div className="mobile-lesson-count">
                    {d.lessons.length}
                  </div>
                )}

                {d.label && !isMobile && <span className="add-lesson-indicator">+</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Day Detail Modal */}
      {dayModalVisible && (
        <div className="day-modal-backdrop" onClick={() => setDayModalVisible(false)}>
          <div className="day-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="day-modal-header">
              <h3>{selectedDayDate?.toDateString()}</h3>
              <button onClick={() => setDayModalVisible(false)} className="close-btn">&times;</button>
            </div>
            <div className="day-modal-body">
              {selectedDayLessons.length > 0 ? (
                selectedDayLessons.map(lesson => (
                  <div
                    key={lesson._id}
                    className="modal-lesson-item"
                    onClick={() => handleNavigateLesson(lesson._id)}
                  >
                    <span className="lesson-topic">{lesson.parameters.specificTopic}</span>
                    <span className="lesson-subject">{lesson.classId?.subject || 'No Subject'}</span>
                  </div>
                ))
              ) : (
                <p>No lessons scheduled.</p>
              )}
            </div>
            <div className="day-modal-footer">
              <button className="create-btn-modal" onClick={handleMobileCreateFromModal}>
                + Plan New Lesson
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;