import React, { useState, useEffect } from "react";
import styles from "./MultiStepPlanner.module.css";
import { getSow } from "../../../services/sowService";
import { Modal } from "antd";

// Import all the modal components
import ActivityInClassModal from "../../../components/Modal/LessonBasedAssessment/ActivityInClassLessonModal";
import EssayModal from "../../../components/Modal/LessonBasedAssessment/EssayLessonModal";
import AssessmentModal from "../../../components/Modal/LessonBasedAssessment/AssessmentLessonModal";
import TextBookModal from "../../../components/Modal/LessonBasedAssessment/TextbookLessonModal";
// NEW: Import SPM Exam modal
import SPMExamModal from "../../../components/Modal/LessonBasedAssessment/SPMExamLessonModal";

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

  // Check if activity has been configured when activity type or configuration changes
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

    // Open the appropriate modal for configuration
    setActiveModal(activityType);
  };

  const handleModalSubmit = (modalData) => {
    console.log("Modal data received:", modalData);

    // Save the activity configuration to the lesson plan data
    const activityConfig = {
      type: data.activityType,
      parameters: modalData,
      configuredAt: new Date().toISOString(),
      configuredFor: modalData.configuredFor || data.activityType, // NEW: Add configuredFor field
    };

    updateData("activityConfiguration", activityConfig);
    setHasConfiguredActivity(true);
    setActiveModal(null);

    console.log("Activity configuration saved:", activityConfig);
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
      Modal.warning({
        title: 'Required Fields',
        content: 'Please fill in all required fields.',
      });
      return;
    }

    // Check if activity has been configured
    if (!hasConfiguredActivity) {
      Modal.warning({
        title: 'Activity Configuration Required',
        content: 'Please configure your selected activity type before proceeding.',
      });
      return;
    }

    onNext();
  };

  // UPDATED: Include SPM Exam in activity type labels
  const getActivityTypeLabel = (type) => {
    const labels = {
      textbook: "Textbook-based Activity",
      essay: "Essay Writing",
      activityInClass: "In-class Activity",
      assessment: "Assessment / Test",
      "spm-exam": "SPM English Examination", // NEW
    };
    return labels[type] || type;
  };

  // UPDATED: Include SPM Exam configuration summary
  const getConfigurationSummary = () => {
    if (!data.activityConfiguration?.parameters) return "Not configured";

    const params = data.activityConfiguration.parameters;
    const type = data.activityType;

    switch (type) {
      case "essay":
        return `${params.essayType || "Unknown type"} essay, ${
          params.wordCount || "Unknown length"
        }, ${params.duration || "Unknown duration"}`;

      case "assessment":
        return `${params.assessmentType || "Unknown type"}, ${
          params.numberOfQuestions || 0
        } questions, ${params.timeAllocation || "Unknown"} minutes`;

      case "activityInClass":
        return `${params.studentArrangement || "Unknown arrangement"}, ${
          params.resourceUsage || "Unknown resources"
        }, ${params.duration || "Unknown duration"}`;

      case "textbook":
        return `Textbook activity${
          params.additionalRequirement
            ? ` - ${params.additionalRequirement.substring(0, 50)}...`
            : ""
        }`;

      // NEW: SPM Exam configuration summary
      case "spm-exam":
        const paperType = params.paperType === "paper1" ? "Paper 1" : "Paper 2";
        const formLevel = params.form === "form4" ? "Form 4" : "Form 5";
        const duration = params.timeAllocation || "90";
        const topic = params.specificTopic || "General";
        return `SPM ${paperType} (${formLevel}), ${duration} min, Topic: ${topic.substring(
          0,
          30
        )}${topic.length > 30 ? "..." : ""}`;

      default:
        return "Configured";
    }
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

        {/* UPDATED: Activity Format with SPM Exam option */}
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
            {/* NEW: SPM Exam option */}
            <option value="spm-exam">
              SPM English Examination (Paper 1 & 2)
            </option>
          </select>

          {/* Show configuration status and summary */}
          {data.activityType && (
            <div style={{ marginTop: "12px" }}>
              {hasConfiguredActivity ? (
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#f6ffed",
                    border: "1px solid #b7eb8f",
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{
                      color: "#52c41a",
                      fontSize: "14px",
                      fontWeight: "600",
                      marginBottom: "4px",
                    }}
                  >
                    ✓ {getActivityTypeLabel(data.activityType)} Configured
                  </div>
                  <div
                    style={{
                      color: "#666",
                      fontSize: "12px",
                      marginBottom: "8px",
                    }}
                  >
                    {getConfigurationSummary()}
                  </div>
                  <button
                    type="button"
                    onClick={handleReconfigureActivity}
                    style={{
                      background: "none",
                      border: "1px solid #d9d9d9",
                      borderRadius: "4px",
                      padding: "4px 12px",
                      fontSize: "12px",
                      cursor: "pointer",
                      color: "#666",
                    }}
                  >
                    Reconfigure Settings
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    padding: "12px",
                    backgroundColor:
                      data.activityType === "spm-exam"
                        ? "#fff0f6" // Special background for SPM exam
                        : "#fff7e6",
                    border:
                      data.activityType === "spm-exam"
                        ? "1px solid #ffadd2" // Pink border for SPM exam
                        : "1px solid #ffd591",
                    borderRadius: "6px",
                    color:
                      data.activityType === "spm-exam"
                        ? "#eb2f96" // Pink text for SPM exam
                        : "#fa8c16",
                    fontSize: "14px",
                  }}
                >
                  {data.activityType === "spm-exam" ? "📊" : "⚠"} Please
                  configure your {getActivityTypeLabel(data.activityType)}{" "}
                  settings
                  {data.activityType === "spm-exam" && (
                    <div
                      style={{
                        fontSize: "12px",
                        marginTop: "4px",
                        opacity: 0.8,
                      }}
                    >
                      Choose between Paper 1 (Reading) or Paper 2 (Writing)
                    </div>
                  )}
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

      {/* UPDATED: Render Modals - All set to lesson planning mode with SPM Exam */}
      {activeModal === "activityInClass" && (
        <ActivityInClassModal
          isOpen={true}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
          selectedLessonPlan={null}
          activityType="activity"
          isLessonPlanningMode={true}
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

      {/* NEW: SPM Exam Modal */}
      {activeModal === "spm-exam" && (
        <SPMExamModal
          isOpen={true}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
          selectedLessonPlan={null}
          activityType="spm-exam"
          isLessonPlanningMode={true}
          existingConfiguration={data.activityConfiguration?.parameters}
        />
      )}
    </div>
  );
};

export default Step2_LessonDetails;
