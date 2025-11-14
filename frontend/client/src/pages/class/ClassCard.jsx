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
                className={styles.cardImageHeader}
                style={{ backgroundImage: `url(${backgroundImage})` }}
            >
                <div className={styles.imageOverlay}></div>
                <div className={styles.subjectBadge}>{classInfo.subject}</div>
            </div>
            <div className={styles.cardBody}>
                <h3 className={styles.className}>
                    {classInfo.className}
                </h3>
                <p className={styles.classMeta}>{gradeDisplay}</p>
            </div>
        </div>
    );
};

export default ClassCard;