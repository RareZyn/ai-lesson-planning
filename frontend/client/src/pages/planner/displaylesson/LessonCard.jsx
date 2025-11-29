import React from "react";
import { useNavigate } from "react-router-dom";
import { getGradientForId } from "../../../utils/gradientColors";
import { CheckCircleOutlined } from '@ant-design/icons';
import styles from "./LessonCard.module.css";

const LessonCard = ({ lesson, isRecent = false, assessments = [] }) => {
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

  // Get day of the week from date
  const getDayOfWeek = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
    });
  };

  // Get short date format
  const getShortDate = (dateString) => {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  };

  // Extract lesson information with fallbacks
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
      <div className={styles.cardHeader} style={{ background: gradient }}>
        <div className={styles.gradientOverlay}></div>

        {/* Date Badge */}
        {lesson.lessonDate && (
          <div className={styles.dateBadge}>
            <div className={styles.dayOfWeek}>{getDayOfWeek(lesson.lessonDate)}</div>
            <div className={styles.dateValue}>{getShortDate(lesson.lessonDate)}</div>
          </div>
        )}

        {/* Subject Badge */}
        <div className={styles.subjectBadge}>{subject}</div>

        {/* Assessment Indicator */}
        {assessments && assessments.length > 0 && (
          <div className={styles.assessmentBadge}>
            <CheckCircleOutlined />
            <span>{assessments.length}</span>
          </div>
        )}
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