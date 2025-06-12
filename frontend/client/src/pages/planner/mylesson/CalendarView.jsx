import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CalendarView.css';

// Days of the week constant for headers
const days = ['Su.', 'Mo.', 'Tu.', 'We.', 'Th.', 'Fr.', 'Sa.'];

const CalendarView = () => {
  const [selectedView, setSelectedView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const navigate = useNavigate();
  const today = new Date();

  // Dummy lessons data for display purposes
  const lessons = [
    { title: 'Mathematics', date: '2025-05-12' },
    { title: 'Physics', date: '2025-05-13' },
    { title: 'Biology', date: '2025-05-16' },
    { title: 'Chemistry', date: '2025-05-12' },
    { title: 'History', date: '2025-05-14' },
  ];

  const handleCreateLesson = (dateForLesson) => {
    if (!dateForLesson) {
      console.error("Cannot create lesson without a valid date.");
      return;
    }
    navigate('/app/test', {
      state: { selectedDate: dateForLesson.toISOString() }
    });
  };

  const getWeekDays = () => {
    const week = [];
    const day = new Date(currentDate);
    const start = day.getDate() - day.getDay();

    for (let i = 0; i < 7; i++) {
      const date = new Date(day.setDate(start + i));
      const dateString = formatDateToYYYYMMDD(date);
      const dayLessons = lessons.filter(lesson => lesson.date === dateString);

      week.push({
        day: days[date.getDay()],
        date: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`,
        isToday: date.toDateString() === today.toDateString(),
        fullDate: date,
        lessons: dayLessons
      });
    }
    return week;
  };

  const formatDateToYYYYMMDD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysArray = [];
    let dayCounter = 1 - firstDayOfWeek;

    for (let i = 0; i < 6 * 7; i++) {
      const date = new Date(year, month, dayCounter);
      daysArray.push({
        date,
        label: date.getMonth() === month ? date.getDate() : '',
        isToday: date.toDateString() === today.toDateString(),
      });
      dayCounter++;
    }
    return daysArray;
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

      {selectedView === 'week' && (
        <div className="week-grid">
          {getWeekDays().map((d, index) => (
            <div className="day-column" key={index}>
              <div className={`day-header ${d.isToday ? 'today' : ''}`}>
                {d.day} {d.date}
              </div>
              <div className="create-lesson">
                <button
                  className="create-btn"
                  onClick={() => handleCreateLesson(d.fullDate)}
                >
                  + Create lesson
                </button>
              </div>
              <div className="day-lessons">
                {d.lessons.map((lesson, i) => (
                  <div key={i} className="lesson-pill">
                    {lesson.title}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedView === 'month' && (
        <div className="month-view-wrapper">
          <div className="month-days-header">
            {days.map((day, i) => (
              <div className="month-day-label" key={i}>
                {day}
              </div>
            ))}
          </div>
          <div className="month-grid">
            {getMonthDays().map((d, i) => {
              const dayLessons = lessons.filter(l =>
                new Date(l.date).toDateString() === d.date.toDateString()
              );
              return (
                <div
                  className={`month-cell ${d.label ? 'active-day' : ''}`}
                  key={i}
                  onClick={d.label ? () => handleCreateLesson(d.date) : undefined}
                >
                  <div className={`month-date ${d.isToday ? 'today' : ''}`}>
                    {d.label}
                  </div>
                  <div className="month-lessons">
                    {dayLessons.map((lesson, idx) => (
                      <div key={idx} className="lesson-pill">
                        {lesson.title}
                      </div>
                    ))}
                  </div>
                  {d.label && <span className="add-lesson-indicator">+</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;