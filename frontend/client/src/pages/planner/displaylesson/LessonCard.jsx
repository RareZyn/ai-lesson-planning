import React from "react";
import { useNavigate } from "react-router-dom";
// NOTE: Removed getGradientForId
import styles from "./LessonCard.module.css";

// --- Subject Color Mapping (for preview accents) ---
const getSubjectColor = (subject) => {
  const colors = {
    English: "#1890ff",     // Blue
    Mathematics: "#f5222d", // Red
    Science: "#52c41a",     // Green
    History: "#fa8c16",     // Orange
    Geography: "#13c2c2",   // Cyan
    Physics: "#722ed1",     // Purple
    Chemistry: "#eb2f96",   // Magenta
    Biology: "#a0d911",     // Lime
  };
  return colors[subject] || "#1890ff"; // Default Blue
};

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

  // Determine Title: Check specificTopic -> Dynamic SOW keys -> lesson.title
  let derivedTitle = lesson.parameters?.specificTopic || lesson.title || "Untitled Lesson";

  if (!lesson.parameters?.specificTopic && lesson.parameters?.sow) {
    const sow = lesson.parameters.sow;
    // Try to find a meaningful title in the dynamic SOW data
    const candidateKeys = ["Title", "title", "Topic", "topic", "Lesson", "lesson", "Unit", "unit"];

    for (const key of candidateKeys) {
      if (sow[key] && typeof sow[key] === 'string') {
        derivedTitle = sow[key];
        break;
      }
    }
  }

  const title = derivedTitle;

  const subjectColor = getSubjectColor(subject);

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
      <div className={styles.cardHeader} style={{ backgroundColor: `${subjectColor}33` }}>
        {/* Document Preview (Real Data) */}
        <div className={styles.previewContainer}>
          {/* Header Section */}
          <div className={styles.previewHeader}>
            <h4 className={styles.previewRealTitle}>{title}</h4>
            <div className={styles.previewRealMeta}>
              <span
                className={styles.previewRealTag}
                style={{ backgroundColor: subjectColor }}
              >
                {subject} {grade ? `• Gr ${grade}` : ''}
              </span>
              {lesson.parameters?.proficiencyLevel && (
                <span
                  className={styles.previewRealTag}
                  style={{ backgroundColor: '#722ed1' }}
                >
                  {lesson.parameters.proficiencyLevel}
                </span>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className={styles.previewContent}>
            {/* Learning Objective */}
            <div className={styles.previewSection}>
              <div className={styles.previewRealSectionTitle}>Learning Objective</div>
              <div className={styles.previewRealText}>
                {lesson.plan?.learningObjective || lesson.parameters?.learningObjective || "No objective defined."}
              </div>
            </div>

            {/* Activities Preview */}
            <div className={styles.previewSection}>
              <div className={styles.previewRealSectionTitle}>Activities</div>
              <div className={styles.previewRealList}>
                {/* Safely map first 3 activities from any available section */}
                {(() => {
                  const activities = lesson.plan?.activities || {};
                  const allActivities = [
                    ...(activities.preLesson || []),
                    ...(activities.duringLesson || []),
                    ...(activities.postLesson || [])
                  ];
                  return allActivities.length > 0 ? (
                    allActivities.slice(0, 3).map((act, i) => (
                      <div key={i} className={styles.previewRealListItem}>{act}</div>
                    ))
                  ) : (
                    <div className={styles.previewRealText}>No activities listed.</div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.cardContent}>

        {/* 1. TITLE */}
        <h3 className={styles.cardTitle} title={title}>
          {title}
        </h3>

        {/* 2. CLASS */}
        <p className={styles.cardClass}>
          {classDisplay} {grade && <span className={styles.gradeTag}>Grade: {grade}</span>}
        </p>

        {/* 3. SUBJECT */}
        <div className={styles.subjectWrapper}>
          <div className={styles.subjectDot} style={{ backgroundColor: subjectColor }}></div>
          <p className={styles.cardSubject}>{subject}</p>
        </div>

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