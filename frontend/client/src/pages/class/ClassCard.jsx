import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ClassCard.module.css';
// Icons are no longer used in the image-based card style

// Map subject to appropriate background images (Keep this utility here)
const getSubjectImage = (subject) => {
    const subjectImages = {
        English: "/Class/english.jpg",
        Mathematics: "/Class/mathematics.jpg",
        Science: "/Class/science.jpg",
        History: "/Class/history.jpg",
        Geography: "/Class/geography.jpg",
        Physics: "/Class/physics.jpg",
        Chemistry: "/Class/chemistry.jpg",
        Biology: "/Class/biology.jpg",
        // Default fallback
        default: "/Class/english.jpg",
    };

    return subjectImages[subject] || subjectImages["default"];
};


const ClassCard = ({ classInfo }) => {
    const navigate = useNavigate();

    const handleCardClick = () => {
        navigate(`/app/classes/${classInfo._id}`);
    };

    const backgroundImage = getSubjectImage(classInfo.subject);

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