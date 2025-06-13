import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLessonPlanById } from '../../../services/lessonService';
import styles from './DisplayLessonPage.module.css'; // We will use a new, improved CSS module

// Import the icons used in the new design
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

const DisplayLessonPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // State for the component
    const [lessonPlan, setLessonPlan] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showParameters, setShowParameters] = useState(false);
    const contentRef = useRef(null); // Ref for the collapsible content height

    // Fetch data when the component mounts or the ID changes
    useEffect(() => {
        const fetchLesson = async () => {
            if (!id) return;
            setIsLoading(true);
            setError(null);
            try {
                const data = await getLessonPlanById(id);
                setLessonPlan(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLesson();
    }, [id]);

    // Loading and Error states
    if (isLoading) return <div className={styles.statusContainer}>Loading...</div>;
    if (error) return <div className={`${styles.statusContainer} ${styles.error}`}>Error: {error}</div>;
    if (!lessonPlan) return <div className={styles.statusContainer}>Lesson Plan not found.</div>;
    
    // Destructure for easier access
    const { parameters, plan, lessonDate, classId } = lessonPlan;

    return (
        <div className={styles.lessonContainer}>
            {/* Back Button */}
            <button className={styles.backButton} onClick={() => navigate(-1)}>
                <ArrowBackIcon className={styles.backIcon} />
                <span>Back</span>
            </button>

            {/* Header */}
            <header className={styles.lessonHeader}>
                <h1 className={styles.lessonTitle}>{parameters.specificTopic || 'Lesson Plan'}</h1>
                <div className={styles.lessonMeta}>
                    <span className={styles.lessonDate}>{new Date(lessonDate).toLocaleDateString()}</span>
                    <span className={styles.lessonClass}>{parameters.grade}</span>
                </div>
            </header>

            {/* Collapsible Parameters Section */}
            <section className={styles.parametersSection}>
                <div className={styles.parametersHeader}>
                    <h3>Lesson Parameters Used</h3>
                </div>
                <div
                    className={`${styles.parametersContentWrapper} ${showParameters ? styles.open : ''}`}
                    style={{ maxHeight: showParameters ? `${contentRef.current?.scrollHeight}px` : '0px' }}
                >
                    <div className={styles.parametersContent} ref={contentRef}>
                        <ul className={styles.parametersList}>
                            <li><strong>Focus:</strong> {parameters.sow.focus} (Lesson {parameters.sow.lessonNo})</li>
                            <li><strong>Proficiency:</strong> {parameters.proficiencyLevel}</li>
                            <li><strong>HOTS Focus:</strong> {parameters.hotsFocus}</li>
                            <li><strong>Additional Notes:</strong> {parameters.additionalNotes || 'None'}</li>
                        </ul>
                    </div>
                </div>
                <div className={styles.parametersToggle} onClick={() => setShowParameters(!showParameters)}>
                    <ArrowDropDownIcon className={`${styles.dropdownIcon} ${showParameters ? styles.open : ''}`} />
                </div>
            </section>

            {/* Main Content Sections */}
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
                            <ul>
                                {(plan.successCriteria || []).map((item, index) => <li key={index}>{item}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div className={styles.lessonPhase}>
                    <h2>Pre-Lesson Activities</h2>
                    <div className={styles.phaseContent}>
                        <ul>
                            {(plan.activities?.preLesson || []).map((activity, index) => <li key={index}>{activity}</li>)}
                        </ul>
                    </div>
                </div>

                <div className={styles.lessonPhase}>
                    <h2>During-Lesson Activities</h2>
                    <div className={styles.phaseContent}>
                        <ul>
                            {(plan.activities?.duringLesson || []).map((activity, index) => <li key={index}>{activity}</li>)}
                        </ul>
                    </div>
                </div>

                <div className={styles.lessonPhase}>
                    <h2>Post-Lesson Activities</h2>
                    <div className={styles.phaseContent}>
                         <ul>
                            {(plan.activities?.postLesson || []).map((activity, index) => <li key={index}>{activity}</li>)}
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DisplayLessonPage;