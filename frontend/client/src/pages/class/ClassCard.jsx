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

    // Extract the number from grade (e.g., "Form 5" -> "5", "Standard 3" -> "3")
    const getFormNumber = (grade) => {
        if (!grade) return '';
        const match = grade.match(/\d+/); // Extract the number
        return match ? match[0] : '';
    };

    // Generate gradient based on form number 
    const getGradientClass = (grade) => {
        const gradients = [
            styles.gradient1,
            styles.gradient2,
            styles.gradient3,
            styles.gradient4,
            styles.gradient5,
            styles.gradient6
        ];
        const formNum = getFormNumber(grade);
        if (!formNum) return styles.gradient1;
        const index = (parseInt(formNum) - 1) % gradients.length;
        return gradients[index];
    };

    const formNumber = getFormNumber(classInfo.grade);
    const displayName = formNumber
        ? `${formNumber} ${classInfo.className}`
        : classInfo.className;

    return (
        <div className={`${styles.card} ${getGradientClass(classInfo.grade)}`} onClick={handleCardClick}>
            <div className={styles.cardHeader}>
                <div className={styles.iconWrapper}>
                    <School fontSize="large" />
                </div>
                <h3 className={styles.className}>{displayName}</h3>
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