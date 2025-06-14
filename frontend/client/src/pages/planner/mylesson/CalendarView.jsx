import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CalendarView.module.css'; // We will create new styles for this component
import { getAllLessonPlans } from '../../../services/lessonService'; // The service to fetch data

// --- Icons for a cleaner UI ---
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarView = () => {
    const [selectedView, setSelectedView] = useState('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const navigate = useNavigate();

    // --- State for fetched data ---
    const [lessons, setLessons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all lesson plans once when the component mounts
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


    // --- Helper functions for date manipulation and data processing ---

    const handleCreateLesson = (dateForLesson) => {
        navigate('/app/planner', { state: { selectedDate: dateForLesson.toISOString() } });
    };

    const handleNavigateLesson = (lessonId) => {
        navigate(`/app/lesson/${lessonId}`);
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

    // --- Data processing for the grids ---

    const getLessonsForDay = (day) => {
        return lessons.filter(lesson => 
            new Date(lesson.lessonDate).toDateString() === day.toDateString()
        );
    };
    
    // Generates all the days to display in the month grid
    const getMonthGridDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysArray = [];

        // Add blank cells for days before the 1st of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            daysArray.push({ key: `empty-${i}`, date: null, isCurrentMonth: false });
        }

        // Add all the actual days of the month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const day = new Date(year, month, i);
            daysArray.push({
                key: day.toISOString(),
                date: day,
                isCurrentMonth: true,
                isToday: day.toDateString() === new Date().toDateString(),
                lessons: getLessonsForDay(day)
            });
        }
        return daysArray;
    };
    
    // Generates the 7 days for the week view
    const getWeekGridDays = () => {
        const week = [];
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Start from Sunday

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            week.push({
                key: day.toISOString(),
                date: day,
                isToday: day.toDateString() === new Date().toDateString(),
                lessons: getLessonsForDay(day)
            });
        }
        return week;
    };


    return (
        <div className={styles.calendarContainer}>
            <header className={styles.calendarHeader}>
                <div className={styles.headerLeft}>
                    <button className={styles.todayBtn} onClick={() => setCurrentDate(new Date())}>Today</button>
                    <div className={styles.calendarNav}>
                        <button onClick={() => changeDate(-1)}><ChevronLeftIcon /></button>
                        <h2>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                        <button onClick={() => changeDate(1)}><ChevronRightIcon /></button>
                    </div>
                </div>
                <div className={styles.viewToggle}>
                    <button className={selectedView === 'month' ? styles.active : ''} onClick={() => setSelectedView('month')}>Month</button>
                    <button className={selectedView === 'week' ? styles.active : ''} onClick={() => setSelectedView('week')}>Week</button>
                </div>
            </header>

            <div className={styles.gridHeader}>
                {daysOfWeek.map(day => <div key={day} className={styles.dayName}>{day}</div>)}
            </div>

            {isLoading && <div className={styles.statusMessage}>Loading lessons...</div>}
            {error && <div className={`${styles.statusMessage} ${styles.error}`}>Error: {error}</div>}

            {!isLoading && !error && selectedView === 'month' && (
                <div className={styles.monthGrid}>
                    {getMonthGridDays().map(dayInfo => (
                        <div key={dayInfo.key} className={`${styles.monthCell} ${!dayInfo.isCurrentMonth ? styles.otherMonth : ''}`}>
                            {dayInfo.date && (
                                <>
                                    <div className={`${styles.dateNumber} ${dayInfo.isToday ? styles.today : ''}`}>
                                        {dayInfo.date.getDate()}
                                    </div>
                                    <div className={styles.lessonsContainer}>
                                        {dayInfo.lessons.map(lesson => (
                                            <div key={lesson._id} className={styles.lessonPill} onClick={() => handleNavigateLesson(lesson._id)}>
                                                {lesson.parameters.specificTopic}
                                            </div>
                                        ))}
                                    </div>
                                    <button className={styles.addLessonBtn} onClick={() => handleCreateLesson(dayInfo.date)}>
                                        <AddCircleOutlineIcon fontSize="small" />
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
            
            {!isLoading && !error && selectedView === 'week' && (
                <div className={styles.weekGrid}>
                     {getWeekGridDays().map(dayInfo => (
                        <div key={dayInfo.key} className={styles.weekDayColumn}>
                             <div className={`${styles.weekDayHeader} ${dayInfo.isToday ? styles.today : ''}`}>
                                <span>{daysOfWeek[dayInfo.date.getDay()]}</span>
                                <span className={styles.weekDateNumber}>{dayInfo.date.getDate()}</span>
                            </div>
                            <div className={styles.lessonsContainer}>
                                {dayInfo.lessons.map(lesson => (
                                    <div key={lesson._id} className={styles.lessonPill} onClick={() => handleNavigateLesson(lesson._id)}>
                                        {lesson.parameters.specificTopic}
                                    </div>
                                ))}
                            </div>
                            <button className={styles.addLessonBtn} onClick={() => handleCreateLesson(dayInfo.date)}>
                                <AddCircleOutlineIcon fontSize="small" /> Create Lesson
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CalendarView;