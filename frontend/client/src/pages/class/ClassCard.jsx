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

    return (
        <div className={styles.card} onClick={handleCardClick}>
            <div className={styles.cardHeader}>
                <div className={styles.iconWrapper}>
                    <School fontSize="large" />
                </div>
                <h3 className={styles.className}>{classInfo.className}</h3>
            </div>
            <div className={styles.cardBody}>
                <p><Subject fontSize="small" /> <span>{classInfo.subject}</span></p>
                <p><CalendarToday fontSize="small" /> <span>Year: {classInfo.year}</span></p>
            </div>
        </div>
    );
};

export default ClassCard;