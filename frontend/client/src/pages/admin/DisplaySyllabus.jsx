import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faEdit,
    faTrash,
    faBook,
    faGraduationCap,
    faCalendar,
    faUser,
    faListOl,
    faBookOpen,
    faLink,
    faChevronLeft, // For pagination
    faChevronRight // For pagination
} from '@fortawesome/free-solid-svg-icons';
import { getSyllabusById, deleteSyllabus } from '../../services/adminService';
import styles from './DisplaySyllabus.module.css';

const DisplaySyllabus = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [syllabus, setSyllabus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10); // Display 10 items per page

    // Refs for each syllabus item to enable scrolling
    const itemRefs = useRef({});

    useEffect(() => {
        fetchSyllabusDetails();
        setCurrentPage(1); // Reset to first page on syllabus change
    }, [id]);

    const fetchSyllabusDetails = async () => {
        try {
            setLoading(true);
            const data = await getSyllabusById(id);
            setSyllabus(data);
            setError('');
        } catch (err) {
            console.error('Error fetching syllabus:', err);
            setError('Failed to load syllabus details');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this syllabus?')) {
            try {
                await deleteSyllabus(id);
                navigate('/app/admin/syllabuses');
            } catch (err) {
                console.error('Error deleting syllabus:', err);
                alert('Failed to delete syllabus');
            }
        }
    };

    const handleEdit = () => {
        alert('Edit functionality coming soon!');
    };

    // Function to scroll to a specific syllabus item
    const scrollToSection = (sectionId) => {
        const element = itemRefs.current[sectionId];
        if (element) {
            const yOffset = -80;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    const renderValue = (value) => {
        if (value === null || value === undefined || value === '') {
            return <span className={styles.notSpecified}>Not specified</span>;
        }

        if (Array.isArray(value)) {
            if (value.length === 0) return <span className={styles.notSpecified}>None</span>;
            return (
                <ul className={styles.nestedList}>
                    {value.map((item, idx) => (
                        <li key={idx}>{renderValue(item)}</li>
                    ))}
                </ul>
            );
        }

        if (typeof value === 'object') {
            return (
                <div className={styles.paramNestedObject}>
                    {Object.entries(value).map(([key, val]) => (
                        <div key={key} className={styles.nestedObjectField}>
                            <strong>{key}:</strong> {renderValue(val)}
                        </div>
                    ))}
                </div>
            );
        }

        return String(value);
    };

    if (loading) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.statusContainer}>Loading syllabus...</div>
            </div>
        );
    }

    if (error || !syllabus) {
        return (
            <div className={styles.pageWrapper}>
                <div className={`${styles.statusContainer} ${styles.error}`}>
                    {error || 'Syllabus not found'}
                </div>
            </div>
        );
    }

    const syllabusItems = Array.isArray(syllabus.data) ? syllabus.data : [syllabus.data];

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = syllabusItems.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(syllabusItems.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
            // Scroll to the top of the main content when changing page
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
            // Scroll to the top of the main content when changing page
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const pageNumbers = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.push(i);
        }
    } else {
        // More complex pagination for many pages (e.g., 1 2 3 ... 9 10)
        if (currentPage <= 4) {
            for (let i = 1; i <= 5; i++) pageNumbers.push(i);
            pageNumbers.push('...');
            pageNumbers.push(totalPages);
        } else if (currentPage >= totalPages - 3) {
            pageNumbers.push(1);
            pageNumbers.push('...');
            for (let i = totalPages - 4; i <= totalPages; i++) pageNumbers.push(i);
        } else {
            pageNumbers.push(1);
            pageNumbers.push('...');
            for (let i = currentPage - 1; i <= currentPage + 1; i++) pageNumbers.push(i);
            pageNumbers.push('...');
            pageNumbers.push(totalPages);
        }
    }


    return (
        <div className={styles.pageWrapper}>
            <div className={styles.mainLayout}>
                {/* Main Content */}
                <div className={styles.mainContent}>
                    <button onClick={() => navigate(-1)} className={styles.backButton}>
                        <FontAwesomeIcon icon={faArrowLeft} /> Back to Syllabuses
                    </button>

                    <div className={styles.lessonHeader}>
                        <div>
                            <h1 className={styles.lessonTitle}>{syllabus.subject} Syllabus</h1>
                            <p className={styles.lessonMeta}>{syllabus.grade}</p>
                        </div>
                        <div className={styles.headerActions}>
                            <button onClick={handleEdit} className={`${styles.actionButton} ${styles.editButton}`}>
                                <FontAwesomeIcon icon={faEdit} /> Edit
                            </button>
                            <button onClick={handleDelete} className={`${styles.actionButton} ${styles.deleteButton}`}>
                                <FontAwesomeIcon icon={faTrash} /> Delete
                            </button>
                        </div>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <nav className={styles.paginationContainer}>
                            <button
                                onClick={prevPage}
                                className={styles.paginationButton}
                                disabled={currentPage === 1}
                            >
                                <FontAwesomeIcon icon={faChevronLeft} />
                            </button>
                            <ul className={styles.paginationList}>
                                {pageNumbers.map((number, index) => (
                                    <li key={index}>
                                        {number === '...' ? (
                                            <span className={styles.paginationEllipsis}>...</span>
                                        ) : (
                                            <button
                                                onClick={() => paginate(number)}
                                                className={`${styles.paginationButton} ${currentPage === number ? styles.activePage : ''}`}
                                            >
                                                {number}
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={nextPage}
                                className={styles.paginationButton}
                                disabled={currentPage === totalPages}
                            >
                                <FontAwesomeIcon icon={faChevronRight} />
                            </button>
                        </nav>
                    )}

                    {/* Syllabus Items */}
                    {currentItems.map((item, index) => {
                        // Calculate global index for accurate TOC links
                        const globalIndex = indexOfFirstItem + index;
                        const itemId = `syllabus-item-${globalIndex}`;
                        return (
                            <div
                                key={globalIndex} // Use globalIndex for key to avoid issues when changing pages
                                id={itemId}
                                ref={el => itemRefs.current[itemId] = el}
                                className={styles.lessonBlock}
                            >
                                <h3 className={styles.blockTitle}>
                                    <FontAwesomeIcon icon={faBookOpen} />
                                    {item.Title || `Item ${globalIndex + 1}`}
                                </h3>

                                {/* Render all fields dynamically */}
                                <div className={styles.syllabusItemContent}>
                                    {Object.entries(item).map(([key, value]) => {
                                        if (key === 'Title') return null;

                                        return (
                                            <div key={key} className={styles.fieldSection}>
                                                <h4 className={styles.fieldLabel}>{key}:</h4>
                                                <div className={styles.fieldValue}>
                                                    {renderValue(value)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Sidebar */}
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarSticky}>
                        <div className={styles.sidebarCard}>
                            <h3 className={styles.sidebarTitle}>Syllabus Information</h3>

                            <div className={styles.metaItem}>
                                <FontAwesomeIcon icon={faGraduationCap} />
                                <div>
                                    <strong>Grade:</strong> {syllabus.grade}
                                </div>
                            </div>

                            <div className={styles.metaItem}>
                                <FontAwesomeIcon icon={faBook} />
                                <div>
                                    <strong>Subject:</strong> {syllabus.subject}
                                </div>
                            </div>

                            <div className={styles.metaItem}>
                                <FontAwesomeIcon icon={faUser} />
                                <div>
                                    <strong>Created By:</strong> {syllabus.createdBy}
                                </div>
                            </div>

                            <div className={styles.metaItem}>
                                <FontAwesomeIcon icon={faCalendar} />
                                <div>
                                    <strong>Date:</strong> {syllabus.date}
                                </div>
                            </div>

                            <div className={styles.metaItem}>
                                <FontAwesomeIcon icon={faListOl} />
                                <div>
                                    <strong>Total Items:</strong> {syllabusItems.length}
                                </div>
                            </div>
                        </div>

                        {/* Table of Contents */}
                        {syllabusItems.length > 0 && (
                            <div className={styles.sidebarCard}>
                                <h3 className={styles.sidebarTitle}>Table of Contents</h3>
                                <div className={styles.tocContainer}>
                                    <ul className={styles.tocList}>
                                        {syllabusItems.map((item, index) => {
                                            const itemId = `syllabus-item-${index}`;
                                            return (
                                                <li key={index}>
                                                    <a
                                                        href={`#${itemId}`}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            // Calculate page number for the item
                                                            const itemPage = Math.ceil((index + 1) / itemsPerPage);
                                                            setCurrentPage(itemPage); // Navigate to the correct page
                                                            // Allow time for the content to render before scrolling
                                                            setTimeout(() => scrollToSection(itemId), 100);
                                                        }}
                                                        className={styles.tocLink}
                                                    >
                                                        {index + 1}.
                                                        <FontAwesomeIcon icon={faLink} />
                                                        {item.Title || `Item ${index + 1}`}
                                                    </a>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </div>
                        )}

                    </div>
                </aside>
            </div>
        </div>
    );
};

export default DisplaySyllabus;