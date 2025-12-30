import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SyllabusManagement.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faArrowLeft, faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import CreateSyllabusModal from './CreateSyllabusModal';
import { getSyllabuses } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Grade definitions
const KSSM_GRADES = ["Form 1", "Form 2", "Form 3", "Form 4", "Form 5"];
const KSSR_GRADES = ["Standard 1", "Standard 2", "Standard 3", "Standard 4", "Standard 5", "Standard 6"];

// Reusable Create Card Component
// Reusable Create Card Component
const CreateSyllabusCard = ({ onClick }) => (
    <div className={styles.addCard} onClick={onClick}>
        <div className={styles.addIconWrapper}>
            <FontAwesomeIcon icon={faPlus} />
        </div>
        <h3 className={styles.addCardTitle}>Create Syllabus</h3>
        <p className={styles.addCardText}>Click to add curriculum</p>
    </div>
);

const SyllabusManagement = ({ searchTerm }) => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [syllabuses, setSyllabuses] = useState([]);
    const [loading, setLoading] = useState(true);

    // State for view management
    const [schoolType, setSchoolType] = useState('KSSM'); // Default fallback
    const [selectedGradeView, setSelectedGradeView] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchSyllabuses();
    }, []);

    // Automatically set school type from user profile
    useEffect(() => {
        if (currentUser?.schoolId?.schoolType) {
            setSchoolType(currentUser.schoolId.schoolType);
        }
    }, [currentUser]);

    const fetchSyllabuses = async () => {
        try {
            setLoading(true);
            const response = await getSyllabuses();
            setSyllabuses(response.data || response);
        } catch (err) {
            console.error('Error fetching syllabuses:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGradeClick = (grade) => {
        setSelectedGradeView(grade);
    };

    const handleBackToGrades = () => {
        setSelectedGradeView(null);
    };

    const handleViewSyllabus = (syllabus) => {
        navigate(`syllabuses/${syllabus.id}`);
    };

    const handleCreateSyllabus = () => {
        setShowCreateModal(true);
    };

    const handleSaveNewSyllabus = async () => {
        await fetchSyllabuses();
        setShowCreateModal(false);
    };

    // Filter syllabuses for the selected grade
    const filteredSyllabuses = syllabuses.filter(syllabus => {
        if (selectedGradeView && syllabus.grade !== selectedGradeView) return false;

        // Search filter
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            return (
                syllabus.grade?.toLowerCase().includes(lowerSearch) ||
                syllabus.subject?.toLowerCase().includes(lowerSearch)
            );
        }
        return true;
    });

    // Get grades based on school type
    const currentGrades = schoolType === 'KSSR' ? KSSR_GRADES : KSSM_GRADES;

    if (loading && !syllabuses.length) {
        return <LoadingSpinner tip="Loading syllabuses..." />;
    }

    return (
        <div className={styles.syllabusManagement}>
            <div className={styles.syllabusHeader}>
                <h2>Syllabus Management</h2>
                {/* Header Actions Removed */}
            </div>

            {/* LEVEL 1: GRADE SELECTION */}
            {!selectedGradeView ? (
                <div className={styles.gradeGrid}>
                    {/* Add Create Card First */}
                    <CreateSyllabusCard onClick={handleCreateSyllabus} />

                    {currentGrades.map((grade) => {
                        // Map grade to image
                        let gradeImage = null;
                        if (grade.toLowerCase().includes('form')) {
                            const formNum = grade.split(' ')[1];
                            gradeImage = `/grade/form${formNum}.webp`;
                        }
                        // Add KSSR mapping if images exist, otherwise fallback or use default

                        return (
                            <div
                                key={grade}
                                className={styles.card} // Use the shared card style
                                onClick={() => handleGradeClick(grade)}
                            >
                                <div
                                    className={styles.cardHeader}
                                    style={{
                                        backgroundImage: gradeImage ? `url(${gradeImage})` : 'none',
                                        backgroundColor: gradeImage ? 'transparent' : '#f8f9fa' // Fallback color
                                    }}
                                >
                                    <div className={styles.imageOverlay}></div>
                                    {!gradeImage && (
                                        <div className={styles.gradeIcon} style={{ position: 'relative', zIndex: 2 }}>
                                            <FontAwesomeIcon icon={faGraduationCap} />
                                        </div>
                                    )}
                                </div>

                                <div className={styles.cardContent}>
                                    <h3 className={styles.cardTitle}>{grade}</h3>
                                    <p className={styles.cardMeta}>
                                        {syllabuses.filter(s => s.grade === grade).length} Subjects
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* LEVEL 2: SUBJECT LIST */
                <div className={styles.subjectView}>
                    <button className={styles.backButton} onClick={handleBackToGrades}>
                        <FontAwesomeIcon icon={faArrowLeft} /> Back to Grades
                    </button>

                    <h3 className={styles.viewTitle}>
                        Subjects for <span className={styles.highlight}>{selectedGradeView}</span>
                    </h3>

                    {filteredSyllabuses.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No syllabuses found for {selectedGradeView}.</p>
                            <button className={styles.createButton} onClick={handleCreateSyllabus}>
                                Create First Syllabus
                            </button>
                        </div>
                    ) : (
                        <div className={styles.subjectGrid}>
                            {filteredSyllabuses.map(syllabus => {
                                // Determine image based on subject
                                const subjectImages = {
                                    English: "/Class/english.webp",
                                    Mathematics: "/Class/mathematics.webp",
                                    Science: "/Class/science.webp",
                                    History: "/Class/history.webp",
                                    Geography: "/Class/geography.webp",
                                    Physics: "/Class/physics.webp",
                                    Chemistry: "/Class/chemistry.webp",
                                    Biology: "/Class/biology.webp",
                                    default: "/Class/education.webp",
                                };
                                const imageUrl = subjectImages[syllabus.subject] || subjectImages["default"];

                                return (
                                    <div
                                        key={syllabus.id}
                                        className={styles.card}
                                        onClick={() => handleViewSyllabus(syllabus)}
                                    >
                                        <div
                                            className={styles.cardHeader}
                                            style={{ backgroundImage: `url(${imageUrl})` }}
                                        >
                                            <div className={styles.imageOverlay}></div>
                                            <div className={styles.subjectBadge}>{syllabus.subject}</div>
                                        </div>

                                        <div className={styles.cardContent}>
                                            <h3 className={styles.cardTitle} title={syllabus.subject}>
                                                {syllabus.subject}
                                            </h3>

                                            <p className={styles.cardClass}>
                                                {syllabus.grade}
                                            </p>

                                            <p className={styles.cardMeta}>
                                                Created: {new Date(syllabus.date || syllabus.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {showCreateModal && (
                <CreateSyllabusModal
                    onClose={() => setShowCreateModal(false)}
                    onSave={handleSaveNewSyllabus}
                    allGrades={currentGrades} // Pass relevant grades
                    initialGrade={selectedGradeView} // Pre-select if in view
                />
            )}
        </div>
    );
};

export default SyllabusManagement;