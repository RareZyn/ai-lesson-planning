import React, { useState, useEffect } from "react";
import styles from "./MultiStepPlanner.module.css";
import { getSow } from "../../../services/sowService";

// Import all the modal components
import ActivityInClassModal from "../../../components/Modal/LessonBasedAssessment/ActivityInClassLessonModal";
import EssayModal from "../../../components/Modal/LessonBasedAssessment/EssayLessonModal";
import AssessmentModal from "../../../components/Modal/LessonBasedAssessment/AssessmentLessonModal";
import TextBookModal from "../../../components/Modal/LessonBasedAssessment/TextbookLessonModal";

const Step2_LessonDetails = ({ data, updateData, onNext, onPrev }) => {
  const [sowLessons, setSowLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for modal management
  const [activeModal, setActiveModal] = useState(null);
  const [hasConfiguredActivity, setHasConfiguredActivity] = useState(false);

  useEffect(() => {
    if (!data.grade) {
      setSowLessons([]);
      return;
    }

    const fetchSowLessons = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log(`Fetching SOW for grade: "${data.grade}"`);
        const response = await getSow(data.grade);
        console.log("SOW Response:", response);

        const lessons = response?.lessons || [];
        if (lessons.length > 0) {
          setSowLessons(lessons);
        } else {
          setError(
            `No lessons found for ${data.grade}. Please check if SOW data exists.`
          );
          setSowLessons([]);
        }
      } catch (err) {
        console.error("Failed to fetch SOW:", err);

        // More detailed error handling
        if (err.response?.status === 404) {
          setError(
            `No scheme of work found for ${data.grade}. Please contact your administrator to add SOW data.`
          );
        } else if (err.response?.status === 401) {
          setError("Authentication failed. Please log in again.");
        } else {
          setError(`Failed to load lessons: ${err.message}`);
        }
        setSowLessons([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSowLessons();
  }, [data.grade]);

  // Check if activity has been configured when activity type changes
  useEffect(() => {
    if (data.activityType && data.activityConfiguration) {
      setHasConfiguredActivity(true);
    } else {
      setHasConfiguredActivity(false);
    }
  }, [data.activityType, data.activityConfiguration]);

  const handleActivityTypeChange = (activityType) => {
    updateData("activityType", activityType);
    // Clear previous configuration when changing activity type
    updateData("activityConfiguration", null);
    setHasConfiguredActivity(false);

    // Open the appropriate modal
    setActiveModal(activityType);
  };

  const handleModalSubmit = (modalData) => {
    console.log("Modal data received:", modalData);

    // Save the activity configuration to the lesson plan data
    updateData("activityConfiguration", {
      type: data.activityType,
      parameters: modalData,
      configuredAt: new Date().toISOString(),
    });

    setHasConfiguredActivity(true);
    setActiveModal(null);
  };

  const handleModalClose = () => {
    setActiveModal(null);
  };

  const handleReconfigureActivity = () => {
    if (data.activityType) {
      setActiveModal(data.activityType);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (
      !data.sow?.lessonNo ||
      !data.specificTopic ||
      !data.activityType ||
      !data.proficiencyLevel ||
      !data.hotsFocus
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    // Check if activity has been configured
    if (!hasConfiguredActivity) {
      alert("Please configure your selected activity type before proceeding.");
      return;
    }

    onNext();
  };

  const getActivityTypeLabel = (type) => {
    const labels = {
      textbook: "Textbook-based Activity",
      essay: "Essay Writing",
      activityInClass: "In-class Activity",
      assessment: "Assessment / Test",
    };
    return labels[type] || type;
  };

  return (
    <div className={styles.stepContent}>
      <h2>Step 2: Lesson Details</h2>
      <p>Fill in the core details based on the KSSM Scheme of Work.</p>

      <form onSubmit={handleSubmit}>
        {/* Lesson from SOW */}
        <div className={styles.formGroup}>
          <label htmlFor="lessonNumber">Lesson from Scheme of Work</label>
          <select
            id="lessonNumber"
            name="lessonNumber"
            value={data.sow?.lessonNo || ""}
            onChange={(e) => {
              const selectedValue = e.target.value;
              const selectedLesson = sowLessons.find(
                (lesson) => lesson.lessonNo.toString() === selectedValue
              );
              updateData("sow", selectedLesson || {});
              if (selectedLesson && selectedLesson.topic) {
                updateData("specificTopic", selectedLesson.topic);
              }
            }}
            disabled={isLoading}
            required
          >
            <option value="" disabled>
              -- Select Lesson --
            </option>
            {isLoading && <option disabled>Loading lessons...</option>}
            {error && <option disabled>Error: {error}</option>}
            {!isLoading && !error && sowLessons.length === 0 && (
              <option disabled>No lessons available for {data.grade}</option>
            )}
            {!isLoading &&
              !error &&
              sowLessons.map((lesson) => (
                <option key={lesson.lessonNo} value={lesson.lessonNo}>
                  Lesson {lesson.lessonNo} - {lesson.topic} ({lesson.focus})
                </option>
              ))}
          </select>

          <small style={{ color: "#666", marginTop: "4px", display: "block" }}>
            {data.grade
              ? `Looking for lessons in ${data.grade}`
              : "Please select a class first"}
            {isLoading && " - Loading..."}
          </small>
        </div>

        {/* Specific Topic */}
        <div className={styles.formGroup}>
          <label htmlFor="specificTopic">
            Lesson Title (Specific Topic or Context)
          </label>
          <input
            type="text"
            id="specificTopic"
            name="specificTopic"
            value={data.specificTopic || ""}
            onChange={(e) => updateData("specificTopic", e.target.value)}
            placeholder="e.g., 'The life of Nicol David'"
            required
          />
          <small style={{ color: "#666", marginTop: "4px", display: "block" }}>
            This field is auto-populated from the SOW topic but you can
            customize it
          </small>
        </div>

        {/* Activity Format - Updated with modal integration */}
        <div className={styles.formGroup}>
          <label htmlFor="activityType">Primary Activity Format</label>
          <select
            id="activityType"
            name="activityType"
            value={data.activityType || ""}
            onChange={(e) => handleActivityTypeChange(e.target.value)}
            required
          >
            <option value="" disabled>
              -- Select a format --
            </option>
            <option value="textbook">Textbook-based Activity</option>
            <option value="essay">Essay Writing</option>
            <option value="activityInClass">
              In-class Activity (e.g., group work, presentation)
            </option>
            <option value="assessment">Assessment / Test</option>
          </select>

          {/* Show configuration status */}
          {data.activityType && (
            <div style={{ marginTop: "8px" }}>
              {hasConfiguredActivity ? (
                <div
                  style={{
                    color: "#52c41a",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>
                    ✓ {getActivityTypeLabel(data.activityType)} configured
                  </span>
                  <button
                    type="button"
                    onClick={handleReconfigureActivity}
                    style={{
                      background: "none",
                      border: "1px solid #d9d9d9",
                      borderRadius: "4px",
                      padding: "2px 8px",
                      fontSize: "12px",
                      cursor: "pointer",
                      color: "#666",
                    }}
                  >
                    Reconfigure
                  </button>
                </div>
              ) : (
                <div style={{ color: "#fa8c16", fontSize: "14px" }}>
                  ⚠ Please configure your{" "}
                  {getActivityTypeLabel(data.activityType)} settings
                </div>
              )}
            </div>
          )}
        </div>

        {/* Proficiency Level */}
        <div className={styles.formGroup}>
          <label htmlFor="proficiencyLevel">Class Proficiency Level</label>
          <select
            id="proficiencyLevel"
            name="proficiencyLevel"
            value={data.proficiencyLevel || ""}
            onChange={(e) => updateData("proficiencyLevel", e.target.value)}
            required
          >
            <option value="" disabled>
              -- Select Proficiency Level --
            </option>
            <option value="A1 Low">A1 Low</option>
            <option value="A1 Mid">A1 Mid</option>
            <option value="A1 High">A1 High</option>
            <option value="A2 Low">A2 Low</option>
            <option value="A2 Mid">A2 Mid</option>
            <option value="A2 High">A2 High</option>
            <option value="B1 Low">B1 Low</option>
            <option value="B1 Mid">B1 Mid</option>
            <option value="B1 High">B1 High</option>
          </select>
        </div>

        {/* HOTS Focus */}
        <div className={styles.formGroup}>
          <label htmlFor="hotsFocus">HOTS Focus</label>
          <select
            id="hotsFocus"
            name="hotsFocus"
            value={data.hotsFocus || ""}
            onChange={(e) => updateData("hotsFocus", e.target.value)}
            required
          >
            <option value="" disabled>
              -- Select HOTS Focus --
            </option>
            <option value="apply">Applying</option>
            <option value="analyse">Analysing</option>
            <option value="evaluate">Evaluating</option>
            <option value="create">Creating</option>
          </select>
        </div>

        {/* Navigation */}
        <div className={styles.navigation}>
          <button
            type="button"
            onClick={onPrev}
            className={styles.secondaryButton}
          >
            Previous
          </button>
          <button type="submit" className={styles.primaryButton}>
            Next Step
          </button>
        </div>
      </form>

      {/* Render Modals */}
      {activeModal === "activityInClass" && (
        <ActivityInClassModal
          isOpen={true}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
          selectedLessonPlan={null} // Not needed in lesson planning context
          activityType="activity"
          isLessonPlanningMode={true} // Flag to indicate this is for lesson planning
          existingConfiguration={data.activityConfiguration?.parameters}
        />
      )}

      {activeModal === "essay" && (
        <EssayModal
          isOpen={true}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
          selectedLessonPlan={null}
          activityType="essay"
          isLessonPlanningMode={true}
          existingConfiguration={data.activityConfiguration?.parameters}
        />
      )}

      {activeModal === "textbook" && (
        <TextBookModal
          isOpen={true}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
          selectedLessonPlan={null}
          isLessonPlanningMode={true}
          existingConfiguration={data.activityConfiguration?.parameters}
        />
      )}

      {activeModal === "assessment" && (
        <AssessmentModal
          isOpen={true}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
          selectedLessonPlan={null}
          isLessonPlanningMode={true}
          existingConfiguration={data.activityConfiguration?.parameters}
        />
      )}
    </div>
  );
};

export default Step2_LessonDetails;
