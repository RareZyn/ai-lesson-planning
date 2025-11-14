import React from "react";
import { useNavigate } from "react-router-dom";
// NOTE: Removed getGradientForId
import styles from "./LessonCard.module.css";

// --- Subject Image Mapping (Placeholder, copied from ClassCard logic) ---
const subjectImages = {
  English: "/subject/english_subject.png",
  Mathematics: "/Class/mathematics.jpg",
  Science: "/Class/science.jpg",
  History: "/Class/history.jpg",
  Geography: "/Class/geography.jpg",
  Physics: "/Class/physics.jpg",
  Chemistry: "/Class/chemistry.jpg",
  Biology: "/Class/biology.jpg",
  default: "/Class/english.jpg",
};

const getSubjectImage = (subject) => {
  return subjectImages[subject] || subjectImages["default"];
};
// ------------------------------------------

const LessonCard = ({ lesson, isRecent = false }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/app/lessons/${lesson._id}`);
  };

  // Helper to format date relative to now (used for 'isRecent' view)
  const formatRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
  };
  
  // Helper to format scheduled date (used for general list view)
  const formatDate = (dateString) => {
    if (!dateString) return "No Date";
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // --- EXTRACT DATA ---
  const subject = lesson.classId?.subject || "General";
  const className = lesson.classId?.className || "Unknown Class";
  const grade =
    lesson.classId?.grade ||
    lesson.parameters?.formLevel ||
    lesson.parameters?.grade ||
    "";
  const lessonDate = lesson.lessonDate; 

  const classDisplay = grade && className !== "Unknown Class" ? className : className;

  const title =
    lesson.parameters?.specificTopic ||
    lesson.parameters?.sow?.topic ||
    lesson.title ||
    "Untitled Lesson";

  const imageUrl = getSubjectImage(subject);

  return (
    <div
      className={styles.card}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleCardClick();
        }
      }}
      aria-label={`Open lesson: ${title}`}
    >
      <div 
        className={styles.cardHeader} 
        style={{ backgroundImage: `url(${imageUrl})` }}
      >
        <div className={styles.imageOverlay}></div> 
        <div className={styles.subjectBadge}>{subject}</div>
      </div>
      
      <div className={styles.cardContent}>
        
        {/* 1. TITLE */}
        <h3 className={styles.cardTitle} title={title}>
          {title}
        </h3>
        
        {/* 2. CLASS */}
        <p className={styles.cardClass}>
          {classDisplay} {grade ? `(Grade ${grade})` : ''}
        </p>

        {/* 3. SUBJECT */}
        <p className={styles.cardSubject}>
          {subject}
        </p>
        
        {/* 4. DATE / META */}
        {isRecent && lesson.updatedAt ? (
          <p className={styles.cardMeta}>
            Last Updated: {formatRelativeDate(lesson.updatedAt)}
          </p>
        ) : (
          <p className={styles.cardMeta}>
            Scheduled: {formatDate(lessonDate)}
          </p>
        )}
      </div>
    </div>
  );
};

export default LessonCard;