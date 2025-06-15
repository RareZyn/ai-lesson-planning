import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getLessonPlanById, deleteLessonPlan, updateLessonPlan } from '../../../services/lessonService';
import { exportToPdf, exportToDocx } from '../../../services/exportService';

import styles from './DisplayLessonPage.module.css';

// Import Icons for the UI
import {
    ArrowBack, Edit, Delete, Save, Cancel, School, CalendarMonth,
    Book, TrackChanges, CheckCircleOutline, SportsEsports, FileDownload,
    PictureAsPdf, Article
} from '@mui/icons-material';

// A recursive component to display the parameters object cleanly.
// Defined outside the main component to prevent re-creation on every render.
const renderParameters = (obj) => {
    // Helper function to format keys from camelCase to Title Case
    const formatKey = (key) => {
        const result = key.replace(/([A-Z])/g, ' $1');
        return result.charAt(0).toUpperCase() + result.slice(1);
    };

    return (
        <ul className={styles.paramSubList}>
            {Object.entries(obj).map(([key, value]) => {
                // Skip internal or unneeded fields
                if (key === '_id' || key === '__v') return null;

                const formattedKey = formatKey(key);

                // If the value is a nested object (but not an array), recurse
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    return (
                        <li key={key} className={styles.paramNestedObject}>
                            <strong>{formattedKey}:</strong>
                            {renderParameters(value)}
                        </li>
                    );
                }
                // Otherwise, render the key and its value
                return (
                    <li key={key}>
                        <strong>{formattedKey}:</strong> {Array.isArray(value) ? value.join(', ') : String(value)}
                    </li>
                );
            })}
        </ul>
    );
};

const DisplayLessonPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [lessonPlan, setLessonPlan] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for Edit Mode
    const [isEditing, setIsEditing] = useState(false);
    const [editedPlan, setEditedPlan] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showExportOptions, setShowExportOptions] = useState(false);


    useEffect(() => {
        const fetchLesson = async () => {
            if (!id) return;
            setIsLoading(true);
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

    // --- Action Handlers ---

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to permanently delete this lesson plan?')) {
            try {
                await deleteLessonPlan(id);
                alert('Lesson plan deleted successfully.');
                navigate('/app/lessons');
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        }
    };

    const handleEdit = () => {
        setEditedPlan(JSON.parse(JSON.stringify(lessonPlan.plan)));
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedPlan(null);
    };

    const handleSaveEdit = async () => {
        setIsSaving(true);
        try {
            const updatedData = await updateLessonPlan(id, editedPlan);
            setLessonPlan(updatedData);
            setIsEditing(false);
            setEditedPlan(null);
            alert('Lesson plan updated successfully!');
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePlanChange = (section, value) => {
        setEditedPlan(prev => ({ ...prev, [section]: value }));
    };

    const handleArrayChange = (section, value) => {
        setEditedPlan(prev => ({ ...prev, [section]: value.split('\n') }));
    };

    const handleActivityChange = (stage, value) => {
        const updatedActivities = { ...editedPlan.activities, [stage]: value.split('\n') };
        handlePlanChange('activities', updatedActivities);
    };

    // --- Render Logic ---

    if (isLoading) return <div className={styles.statusContainer}>Loading...</div>;
    if (error) return <div className={`${styles.statusContainer} ${styles.error}`}>{error}</div>;
    if (!lessonPlan) return <div className={styles.statusContainer}>Lesson Plan not found.</div>;

    const { parameters, lessonDate } = lessonPlan;
    const displayPlan = isEditing ? editedPlan : lessonPlan.plan;

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.mainLayout}>
                <main className={styles.mainContent}>
                    <Link to="/app/lessons" className={styles.backButton}>
                        <ArrowBack /> Back to All Lessons
                    </Link>

                    <header className={styles.lessonHeader}>
                        <div className={styles.headerMain}>
                            <h1 className={styles.lessonTitle}>{parameters.specificTopic}</h1>
                            <p className={styles.lessonMeta}>
                                For <strong>{lessonPlan.classId?.className || 'N/A'}</strong>
                            </p>
                        </div>
                        <div className={styles.headerActions}>
                            {isEditing ? (
                                // --- This is the VIEW in EDIT MODE ---
                                <>
                                    <button
                                        onClick={handleCancelEdit}
                                        className={`${styles.actionButton} ${styles.cancelButton}`}
                                        disabled={isSaving}
                                    >
                                        <Cancel fontSize="small" /> Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveEdit}
                                        className={`${styles.actionButton} ${styles.saveButton}`}
                                        disabled={isSaving}
                                    >
                                        <Save fontSize="small" /> {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </>
                            ) : (
                                // --- This is the VIEW in READ-ONLY MODE ---
                                <>
                                    {/* --- NEW: Export Dropdown Button --- */}
                                    <div className={styles.exportContainer}>
                                        <button
                                            onClick={() => setShowExportOptions(!showExportOptions)}
                                            className={`${styles.actionButton} ${styles.exportButton}`}
                                        >
                                            <FileDownload fontSize="small" /> Export
                                        </button>

                                        {/* The Dropdown Menu that appears on click */}
                                        {showExportOptions && (
                                            <div className={styles.exportMenu}>
                                                <button onClick={() => {
                                                    exportToPdf(displayPlan, parameters, lessonDate, lessonPlan.classId);
                                                    setShowExportOptions(false); // Close menu after click
                                                }}>
                                                    <PictureAsPdf fontSize="small" /> As PDF
                                                </button>
                                                <button onClick={() => {
                                                    exportToDocx(displayPlan, parameters, lessonDate, lessonPlan.classId);
                                                    setShowExportOptions(false); // Close menu after click
                                                }}>
                                                    <Article fontSize="small" /> As DOCX
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {/* --- End of Export Dropdown --- */}

                                    <button
                                        onClick={handleEdit}
                                        className={`${styles.actionButton} ${styles.editButton}`}
                                    >
                                        <Edit fontSize="small" /> Edit
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className={`${styles.actionButton} ${styles.deleteButton}`}
                                    >
                                        <Delete fontSize="small" /> Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </header>

                    <div className={styles.lessonBlock}>
                        <h3 className={styles.blockTitle}><TrackChanges /> Learning Objective</h3>
                        {isEditing ? (
                            <textarea className={styles.editableTextarea} rows="3" value={displayPlan.learningObjective} onChange={(e) => handlePlanChange('learningObjective', e.target.value)} />
                        ) : (
                            <p>{displayPlan.learningObjective}</p>
                        )}
                    </div>

                    <div className={styles.lessonBlock}>
                        <h3 className={styles.blockTitle}><CheckCircleOutline /> Success Criteria</h3>
                        {isEditing ? (
                            <textarea className={styles.editableTextarea} rows="5" placeholder="One criterion per line..." value={displayPlan.successCriteria.join('\n')} onChange={(e) => handleArrayChange('successCriteria', e.target.value)} />
                        ) : (
                            <ul>{displayPlan.successCriteria.map((item, i) => <li key={i}>{item}</li>)}</ul>
                        )}
                    </div>

                    <div className={styles.lessonBlock}>
                        <h3 className={styles.blockTitle}><SportsEsports /> Activities</h3>
                        <div className={styles.activitySection}>
                            <h4>Pre-Lesson</h4>
                            {isEditing ? (
                                <textarea className={styles.editableTextarea} rows="4" placeholder="One activity per line..." value={displayPlan.activities.preLesson.join('\n')} onChange={(e) => handleActivityChange('preLesson', e.target.value)} />
                            ) : (
                                <ul>{displayPlan.activities.preLesson.map((item, i) => <li key={i}>{item}</li>)}</ul>
                            )}
                        </div>
                        <div className={styles.activitySection}>
                            <h4>During-Lesson</h4>
                            {isEditing ? (
                                <textarea className={styles.editableTextarea} rows="8" placeholder="One activity per line..." value={displayPlan.activities.duringLesson.join('\n')} onChange={(e) => handleActivityChange('duringLesson', e.target.value)} />
                            ) : (
                                <ul>{displayPlan.activities.duringLesson.map((item, i) => <li key={i}>{item}</li>)}</ul>
                            )}
                        </div>
                        <div className={styles.activitySection}>
                            <h4>Post-Lesson</h4>
                            {isEditing ? (
                                <textarea className={styles.editableTextarea} rows="4" placeholder="One activity per line..." value={displayPlan.activities.postLesson.join('\n')} onChange={(e) => handleActivityChange('postLesson', e.target.value)} />
                            ) : (
                                <ul>{displayPlan.activities.postLesson.map((item, i) => <li key={i}>{item}</li>)}</ul>
                            )}
                        </div>
                    </div>
                </main>

                <aside className={styles.sidebar}>
                    <div className={styles.sidebarSticky}>
                        <div className={styles.sidebarCard}>
                            <h3 className={styles.sidebarTitle}>Lesson Details</h3>
                            <div className={styles.metaItem}><School /> <span>{lessonPlan.classId?.className || 'N/A'}</span></div>
                            <div className={styles.metaItem}><CalendarMonth /> <span>{new Date(lessonDate).toLocaleDateString()}</span></div>
                        </div>

                        <div className={styles.sidebarCard}>
                            <h3 className={styles.sidebarTitle}>Scheme of Work</h3>
                            <div className={styles.metaItem}><Book /> <span>Lesson {parameters.sow.lessonNo}: {parameters.sow.topic}</span></div>
                            <p className={styles.sowFocus}>{parameters.sow.focus} - {parameters.sow.theme}</p>
                        </div>

                        <div className={styles.sidebarCard}>
                            <h3 className={styles.sidebarTitle}>Generation Parameters</h3>
                            {renderParameters(parameters)}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default DisplayLessonPage;