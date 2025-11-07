import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ClassCard.module.css';
import { School, Subject, CalendarToday } from '@mui/icons-material';

const ClassCard = ({ classInfo }) => {
    const navigate = useNavigate();

    const handleCardClick = () => {
        // Navigate to the new page, passing the classId in the URL
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
                <p><Subject fontSize="small" /> <span>{classInfo.subject}</span></p>
                <p><CalendarToday fontSize="small" /> <span>Year: {classInfo.year}</span></p>
            </div>
        </div>
    );
};

export default ClassCard;