import React from "react";
import { useNavigate } from "react-router-dom";
import { getGradientForId } from "../../../utils/gradientColors";
import styles from "./LessonCard.module.css";

const LessonCard = ({ lesson, isRecent = false }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/app/lessons/${lesson._id}`);
  };

  // Formats a date into a human-readable relative time string
  const formatRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
  };

  // Extract lesson information with fallbacks
  const subject = lesson.classId?.subject || "General";
  const className = lesson.classId?.className || "Unknown Class";
  const grade =
    lesson.classId?.grade ||
    lesson.parameters?.formLevel ||
    lesson.parameters?.grade ||
    "";

  // Format the class display with grade and className
  const classDisplay =
    grade && className !== "Unknown Class"
      ? `${grade} ${className}`
      : className;

  // Use the SOW topic as a fallback for the title if specificTopic is empty
  const title =
    lesson.parameters?.specificTopic ||
    lesson.parameters?.sow?.topic ||
    lesson.title ||
    "Untitled Lesson";

  // Get consistent gradient for this lesson using the utility function
  const gradient = getGradientForId(lesson._id);

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
        <div className={styles.subjectBadge}>{subject}</div>
      </div>
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle} title={title}>
          {title}
        </h3>
        <p className={styles.cardGrade}>{classDisplay}</p>
        {isRecent && lesson.updatedAt && (
          <p className={styles.cardMeta}>
            Opened {formatRelativeDate(lesson.updatedAt)}
          </p>
        )}
      </div>
    </div>
  );
};

export default LessonCard;
