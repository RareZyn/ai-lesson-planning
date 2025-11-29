import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SyllabusManagement.module.css'; // <-- Changed import
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons'; 
import CreateSyllabusModal from './CreateSyllabusModal';
import { getSyllabuses, deleteSyllabus } from '../../services/adminService';

const SyllabusManagement = ({ searchTerm }) => {
    const navigate = useNavigate();
    const [syllabuses, setSyllabuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchSyllabuses();
    }, []);

    const fetchSyllabuses = async () => {
        try {
            setLoading(true);
            const response = await getSyllabuses(); 
            setSyllabuses(response.data || response); 
            setError('');
        } catch (err) {
            console.error('Error fetching syllabuses:', err);
            setError('Failed to load syllabuses');
        } finally {
            setLoading(false);
        }
    };

    const allGrades = [...new Set(syllabuses.map(s => s.grade))].sort();
    const subjectsForSelectedGrade = selectedGrade
        ? [...new Set(syllabuses.filter(s => s.grade === selectedGrade).map(s => s.subject))].sort()
        : [];

    const syllabusMatchesSearch = (syllabus, searchTerm) => {
        if (!searchTerm) return true;
        
        const lowerSearch = searchTerm.toLowerCase();
        
        if (syllabus.grade?.toLowerCase().includes(lowerSearch)) return true;
        if (syllabus.subject?.toLowerCase().includes(lowerSearch)) return true;
        
        return false;
    };

    const filteredSyllabuses = syllabuses.filter(syllabus =>
        (selectedGrade === '' || syllabus.grade === selectedGrade) &&
        (selectedSubject === '' || syllabus.subject === selectedSubject) &&
        syllabusMatchesSearch(syllabus, searchTerm)
    );

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

    if (loading) {
        return (
            <div className={styles.syllabusManagement}>
                <div className={styles.loadingContainer}>
                    <p>Loading syllabuses...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.syllabusManagement}>
                <div className={styles.errorContainer}>
                    <p>{error}</p>
                    <button onClick={fetchSyllabuses}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.syllabusManagement}>
            <div className={styles.syllabusHeader}>
                <h2>Syllabus List</h2>
                <button className={styles.createButton} onClick={handleCreateSyllabus}>
                    <FontAwesomeIcon icon={faPlus} /> Create Syllabus
                </button>
            </div>

            <div className={styles.filterControls}>
                <label>
                    Grade:
                    <select value={selectedGrade} onChange={(e) => { setSelectedGrade(e.target.value); setSelectedSubject(''); }}>
                        <option value="">All Grades</option>
                        {allGrades.map(grade => (
                            <option key={grade} value={grade}>{grade}</option>
                        ))}
                    </select>
                </label>
                <label>
                    Subject:
                    <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} disabled={!selectedGrade}>
                        <option value="">All Subjects</option>
                        {subjectsForSelectedGrade.map(subject => (
                            <option key={subject} value={subject}>{subject}</option>
                        ))}
                    </select>
                </label>
            </div>

            {filteredSyllabuses.length === 0 ? (
                <p>No syllabuses found matching your search and filters. Click "Create Syllabus" to add one!</p>
            ) : (
                <div className={styles.listContainer}>
                    
                    {/* 4-COLUMN HEADER */}
                    <div className={`${styles.listHeader} ${styles.listItem}`}>
                        <div className={styles.listDetail}>Grade</div>
                        <div className={styles.listDetail}>Subject</div>
                        <div className={styles.listDetail}>Created By</div>
                        <div className={styles.listDetail}>Date Created</div>
                    </div>
                    
                    <div className={styles.syllabusList}>
                        {filteredSyllabuses.map(syllabus => (
                            <div 
                                key={syllabus.id} 
                                className={`${styles.listItem} ${styles.clickable}`}
                                onClick={() => handleViewSyllabus(syllabus)}
                            >
                                <div className={styles.listDetail}>{syllabus.grade}</div>
                                <div className={styles.listDetail}>{syllabus.subject}</div>
                                <div className={styles.listDetail}>{syllabus.createdBy || 'Admin'}</div>
                                <div className={styles.listDetail}>{syllabus.date || syllabus.createdAt || 'N/A'}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showCreateModal && (
                <CreateSyllabusModal
                    onClose={() => setShowCreateModal(false)}
                    onSave={handleSaveNewSyllabus}
                    allGrades={allGrades}
                />
            )}
        </div>
    );
};

export default SyllabusManagement;