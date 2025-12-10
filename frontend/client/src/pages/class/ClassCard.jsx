import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ClassCard.module.css';

// Function to get grade/form-specific images
const getGradeImage = (grade) => {
    if (!grade) return '/grade/form1.webp'; // Default fallback

    // Extract form number from grade string (e.g., "Form 1" -> "1")
    const formMatch = grade.match(/Form\s*(\d+)/i);
    if (formMatch) {
        const formNumber = formMatch[1];
        return `/grade/form${formNumber}.webp`;
    }

    // For Standard grades, you can map them or use a default
    // Standard 1-6 can map to form1-5 or have their own images
    const standardMatch = grade.match(/Standard\s*(\d+)/i);
    if (standardMatch) {
        const standardNumber = standardMatch[1];
        // Map Standard to forms (customize as needed)
        const formMap = { '1': '1', '2': '1', '3': '2', '4': '3', '5': '4', '6': '5' };
        return `/grade/form${formMap[standardNumber] || '1'}.webp`;
    }

    return '/grade/form1.webp'; // Default fallback
};

const ClassCard = ({ classInfo }) => {
    const navigate = useNavigate();

    const handleCardClick = () => {
        navigate(`/app/classes/${classInfo._id}`);
    };

    const backgroundImage = getGradeImage(classInfo.grade);

    // Ensure grade is displayed, using year as a fallback detail
    const gradeDisplay = classInfo.grade ? `Grade: ${classInfo.grade}` : `Year: ${classInfo.year}`;


    return (
        <div className={styles.card} onClick={handleCardClick}>
            <div
                className={styles.cardHeader}
                style={{ backgroundImage: `url(${backgroundImage})` }}
            >
                <div className={styles.imageOverlay}></div>
                <div className={styles.subjectBadge}>{classInfo.subject}</div>
            </div>
            <div className={styles.cardContent}>
                {/* 1. TITLE */}
                <h3 className={styles.cardTitle}>
                    {classInfo.className}
                </h3>

                {/* 2. CLASS/GRADE */}
                <p className={styles.cardClass}>
                    {gradeDisplay}
                </p>

                {/* 3. SUBJECT (Optional, since it's in the badge, but keeping for consistency if needed, or we can omit) */}
                {/* <p className={styles.cardSubject}>{classInfo.subject}</p> */}
            </div>
        </div>
    );
};

export default ClassCard;