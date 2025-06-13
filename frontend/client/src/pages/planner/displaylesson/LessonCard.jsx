import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LessonCard.module.css'; // We will update this file next

// A mapping of subjects to thumbnail images.
// Place these images in your `public/images/subjects/` folder.
const subjectThumbnails = {
    'English': '/Class/english.jpg',
    'Mathematics': '/images/subjects/math.png',
    'Science': '/images/subjects/science.png',
    'History': '/images/subjects/history.png',
    'Default': '/images/subjects/default.png' // A fallback image
};

const LessonCard = ({ lesson, isRecent = false }) => {
    const navigate = useNavigate();

    const handleCardClick = () => {
        navigate(`/app/lesson/${lesson._id}`);
    };

    // Formats a date into a human-readable relative time string
    const formatRelativeDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return "Just now";
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    };

    const subject = lesson.classId?.subject || 'General';
    const className = lesson.classId?.className || 'N/A';
    // Use the SOW topic as a fallback for the title if specificTopic is empty
    const title = lesson.parameters.specificTopic || lesson.parameters.sow.topic || 'Untitled Lesson';

    const thumbnail = subjectThumbnails[subject] || subjectThumbnails['Default'];

    return (
        <div className={styles.card} onClick={handleCardClick}>
            <div className={styles.cardHeader}>
                <img src={thumbnail} alt={subject} className={styles.subjectImage} />
                <div className={styles.subjectBadge}>{subject}</div>
            </div>
            <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{title}</h3>
                <p className={styles.cardGrade}>{className}</p>
                {isRecent && <p className={styles.cardMeta}>Opened {formatRelativeDate(lesson.updatedAt)}</p>}
            </div>
        </div>
    );
};

export default LessonCard;