import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getLessonPlansByClass } from '../../services/lessonService';
import { getClassById, deleteClass } from '../../services/classService';
import LessonCard from '../planner/displaylesson/LessonCard';
import CreateClassModal from './CreateClassModal'; // For editing the class
import styles from './ClassLessonsPage.module.css';

// Icons for the UI
import { ArrowBack, Edit, Delete, Add } from '@mui/icons-material';

const ClassLessonsPage = () => {
    const { classId } = useParams();
    const navigate = useNavigate();
    
    const [lessons, setLessons] = useState([]);
    const [classInfo, setClassInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // State to control the edit modal visibility
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Fetch both class info and its associated lessons
    const fetchData = useCallback(async () => {
        if (!classId) return;
        setIsLoading(true);
        setError(null);
        try {
            // Fetch both pieces of data in parallel for better performance
            const [classResponse, lessonData] = await Promise.all([
                getClassById(classId),
                getLessonPlansByClass(classId)
            ]);
            setClassInfo(classResponse.data);
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

    // Handler to open the edit modal
    const handleEdit = () => {
        setIsEditModalOpen(true);
    };

    // Handler for deleting the class
    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete the class "${classInfo.className}" and all its lesson plans? This action cannot be undone.`)) {
            try {
                await deleteClass(classId);
                alert('Class and all associated lessons have been deleted successfully.');
                navigate('/app/classes'); // Navigate back to the main class list
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        }
    };

    // Callback for when the modal saves an edit successfully
    const handleEditSaveSuccess = () => {
        setIsEditModalOpen(false);
        fetchData(); // Re-fetch data to show the updated class info
    };
    
    // Handler to navigate to the planner with the class pre-selected
    const handleCreateLesson = () => {
        // Pass classInfo to the planner so it can be pre-filled in Step 1
        navigate('/app/planner', { state: { preselectedClass: classInfo } });
    };

    if (isLoading) return <div className={styles.status}>Loading class details...</div>;
    if (error) return <div className={`${styles.status} ${styles.error}`}>Error: {error}</div>;

    return (
        <div className={styles.container}>
            <Link to="/app/classes" className={styles.backButton}>
                <ArrowBack /> Back to All Classes
            </Link>

            <header className={styles.header}>
                <div className={styles.headerMain}>
                    <h1>{classInfo?.className}</h1>
                    <p>{classInfo?.subject} - Year {classInfo?.year}</p>
                </div>
                <div className={styles.headerActions}>
                    <button onClick={handleEdit} className={`${styles.actionButton} ${styles.editButton}`}>
                        <Edit fontSize="small" /> Edit Class
                    </button>
                    <button onClick={handleDelete} className={`${styles.actionButton} ${styles.deleteButton}`}>
                        <Delete fontSize="small" /> Delete Class
                    </button>
                </div>
            </header>
            
            <main>
                {lessons.length > 0 ? (
                    <div className={styles.lessonsGrid}>
                        {lessons.map(lesson => (
                            <LessonCard key={lesson._id} lesson={lesson} />
                        ))}
                    </div>
                ) : (
                    <div className={styles.empty}>
                        <h2>No Lessons Yet</h2>
                        <p>Get started by creating the first lesson plan for this class.</p>
                        <button className={styles.createButton} onClick={handleCreateLesson}>
                            <Add /> Create Lesson Plan
                        </button>
                    </div>
                )}
            </main>
            
            {/* The "Create/Edit Class" modal is reused here for editing */}
            {isEditModalOpen && (
                <CreateClassModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleEditSaveSuccess}
                    currentClass={classInfo} // Pass the current class data to pre-fill the form
                />
            )}
        </div>
    );
};

export default ClassLessonsPage;