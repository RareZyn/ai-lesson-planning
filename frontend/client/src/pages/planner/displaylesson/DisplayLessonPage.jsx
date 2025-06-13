import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLessonPlanById, deleteLessonPlan } from '../../../services/lessonService';
import styles from './DisplayLessonPage.module.css';

// Import Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const DisplayLessonPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [lessonPlan, setLessonPlan] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showParameters, setShowParameters] = useState(false);
    const contentRef = useRef(null);

    useEffect(() => {
        const fetchLesson = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const data = await getLessonPlanById(id);
                console.log('Fetched Lesson Plan:', data); // Debugging log
                setLessonPlan(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLesson();
    }, [id]);

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to permanently delete this lesson plan?')) {
            try {
                await deleteLessonPlan(id);
                alert('Lesson plan deleted successfully.');
                navigate('/app/lessons'); // Navigate to the main list after deletion
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        }
    };
    
    // The edit handler will be simple for now, but can be expanded
    const handleEdit = () => {
        // You can navigate to a new edit page or a pre-filled planner
        alert('Edit functionality not yet implemented.');
        // Example: navigate(`/app/planner/edit/${id}`);
    };

    if (isLoading) return <div className={styles.statusContainer}>Loading...</div>;
    if (error) return <div className={`${styles.statusContainer} ${styles.error}`}>Error: {error}</div>;
    if (!lessonPlan) return <div className={styles.statusContainer}>Lesson Plan not found.</div>;
    
    const { parameters, plan, lessonDate } = lessonPlan;

    return (
        <div className={styles.lessonContainer}>
            <button className={styles.backButton} onClick={() => navigate('/app/my-lessons')}>
                <ArrowBackIcon className={styles.backIcon} />
                <span>Back to Lessons</span>
            </button>

            <header className={styles.lessonHeader}>
                <div className={styles.headerMain}>
                    <h1 className={styles.lessonTitle}>{parameters.specificTopic}</h1>
                    <div className={styles.lessonMeta}>
                        <span className={styles.lessonClass}>{lessonPlan.classId?.className || 'N/A'}</span>
                        <span className={styles.lessonDate}>{new Date(lessonDate).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <button onClick={handleEdit} className={`${styles.actionButton} ${styles.editButton}`}>
                        <EditIcon fontSize="small" /> Edit
                    </button>
                    <button onClick={handleDelete} className={`${styles.actionButton} ${styles.deleteButton}`}>
                        <DeleteIcon fontSize="small" /> Delete
                    </button>
                </div>
            </header>

            <section className={styles.parametersSection}>
                <div className={styles.parametersHeader} onClick={() => setShowParameters(!showParameters)}>
                    <h3>Lesson Generation Parameters</h3>
                    <ArrowDropDownIcon className={`${styles.dropdownIcon} ${showParameters ? styles.open : ''}`} />
                </div>
                <div
                    className={`${styles.parametersContentWrapper} ${showParameters ? styles.open : ''}`}
                    style={{ maxHeight: showParameters ? `${contentRef.current?.scrollHeight}px` : '0px' }}
                >
                    <div className={styles.parametersContent} ref={contentRef}>
                        <ul className={styles.parametersList}>
                            <li><strong>Grade:</strong> {parameters.grade}</li>
                            <li><strong>Proficiency Level:</strong> {parameters.proficiencyLevel}</li>
                            <li><strong>HOTS Focus:</strong> {parameters.hotsFocus}</li>
                            <li><strong>Additional Notes:</strong> {parameters.additionalNotes || 'None'}</li>
                            <li className={styles.sowDetails}>
                                <strong>Scheme of Work Details:</strong>
                                <ul>
                                    <li>Lesson {parameters.sow.lessonNo}: {parameters.sow.topic}</li>
                                    <li>Focus: {parameters.sow.focus}</li>
                                    <li>Theme: {parameters.sow.theme}</li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            <main className={styles.lessonContent}>
                <div className={styles.lessonPhase}>
                    <h2>Learning Objective & Success Criteria</h2>
                    <div className={styles.phaseContent}>
                        <div className={styles.contentSection}>
                            <h4>Objective:</h4>
                            <p>{plan.learningObjective}</p>
                        </div>
                        <div className={styles.contentSection}>
                            <h4>Success Criteria:</h4>
                            <ul>{(plan.successCriteria || []).map((item, index) => <li key={index}>{item}</li>)}</ul>
                        </div>
                    </div>
                </div>
                
                <div className={styles.lessonPhase}>
                    <h2>Lesson Activities</h2>
                    <div className={styles.phaseContent}>
                        <div className={styles.contentSection}>
                            <h4>Pre-Lesson</h4>
                            <ul>{(plan.activities?.preLesson || []).map((activity, index) => <li key={index}>{activity}</li>)}</ul>
                        </div>
                        <div className={styles.contentSection}>
                            <h4>During-Lesson</h4>
                            <ul>{(plan.activities?.duringLesson || []).map((activity, index) => <li key={index}>{activity}</li>)}</ul>
                        </div>
                        <div className={styles.contentSection}>
                            <h4>Post-Lesson</h4>
                            <ul>{(plan.activities?.postLesson || []).map((activity, index) => <li key={index}>{activity}</li>)}</ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DisplayLessonPage;