import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLessonPlansByClass } from '../../services/lessonService';
import { getClassById } from '../../services/classService';
import LessonCard from '../planner/displaylesson/LessonCard'; // Assuming this is your vertical lesson card
import styles from './ClassLessonsPage.module.css'; // You'll create this CSS file
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ClassLessonsPage = () => {
    const { classId } = useParams();
    const navigate = useNavigate();
    
    const [lessons, setLessons] = useState([]);
    const [classInfo, setClassInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!classId) return;
        setIsLoading(true);
        setError(null);
        try {
            // Fetch both class info and lesson plans in parallel for efficiency
            const [classResponse, lessonData] = await Promise.all([
                getClassById(classId),
                getLessonPlansByClass(classId)
            ]);
            setClassInfo(classResponse.data); // The class info is nested in .data
            setLessons(lessonData);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) return <div className={styles.status}>Loading...</div>;
    if (error) return <div className={styles.status}>{error}</div>;

    return (
        <div className={styles.container}>
            <button className={styles.backButton} onClick={() => navigate('/app/classes')}>
                <ArrowBackIcon /> Back to All Classes
            </button>
            <header className={styles.header}>
                <h1>{classInfo?.className}</h1>
                <p>{classInfo?.subject} - Year {classInfo?.year}</p>
            </header>
            
            {lessons.length > 0 ? (
                <div className={styles.lessonsGrid}>
                    {lessons.map(lesson => (
                        // This reuses your vertical 'LessonCard' for displaying plans
                        <LessonCard key={lesson._id} lesson={lesson} />
                    ))}
                </div>
            ) : (
                <div className={styles.empty}>
                    <h2>No Lessons Yet</h2>
                    <p>No lesson plans have been created for this class.</p>
                    <button 
                        className={styles.createButton} 
                        onClick={() => navigate('/app/lessons')}
                    >
                        Create Your First Lesson Plan
                    </button>
                </div>
            )}
        </div>
    );
};

export default ClassLessonsPage;