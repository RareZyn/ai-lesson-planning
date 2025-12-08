import React, { useState, useEffect } from "react";
import styles from "./MultiStepPlanner.module.css";
import { getSyllabuses, getSyllabusById } from "../../../services/adminService";

// Import all the modal components
import ActivityInClassModal from "../../../components/Modal/LessonBasedAssessment/ActivityInClassLessonModal";
import EssayModal from "../../../components/Modal/LessonBasedAssessment/EssayLessonModal";
import AssessmentModal from "../../../components/Modal/LessonBasedAssessment/AssessmentLessonModal";
import TextBookModal from "../../../components/Modal/LessonBasedAssessment/TextbookLessonModal";
// NEW: Import SPM Exam modal
import SPMExamModal from "../../../components/Modal/LessonBasedAssessment/SPMExamLessonModal";

const Step2_LessonDetails = ({ data, updateData, onNext, onPrev }) => {
  const [syllabusItems, setSyllabusItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for modal management
  const [activeModal, setActiveModal] = useState(null);
  const [hasConfiguredActivity, setHasConfiguredActivity] = useState(false);

  useEffect(() => {
    if (!data.grade) {
      setSyllabusItems([]);
      return;
    }

    const fetchSyllabusData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log(`Fetching Syllabuses for grade: "${data.grade}"`);
        const allSyllabuses = await getSyllabuses();

        // Filter by grade
        // NOTE: ideally we should also filter by subject if available in 'data'
        const matchingSyllabus = allSyllabuses.find(s => s.grade === data.grade);

        if (matchingSyllabus) {
          // BUG FIX: Controller returns 'id', not '_id'
          const fullSyllabus = await getSyllabusById(matchingSyllabus.id);
          const items = fullSyllabus.data || []; // Assuming 'data' contains the array of topics

          if (items.length > 0) {
            setSyllabusItems(items);
          } else {
            setSyllabusItems([]);
            setError(`Syllabus found for ${data.grade} but it has no no items/topics.`);
          }

        } else {
          setSyllabusItems([]);
          setError(`No syllabus found for ${data.grade}. Please upload one in Admin.`);
        }

      } catch (err) {
        console.error("Failed to fetch Syllabus:", err);
        setError("Failed to load syllabus data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSyllabusData();
  }, [data.grade]);

  // Check if activity has been configured when activity type or configuration changes
  useEffect(() => {
    if (data.activityType && data.activityConfiguration) {
      setHasConfiguredActivity(true);
    } else {
      setHasConfiguredActivity(false);
    }
  }, [data.activityType, data.activityConfiguration]);

  // NEW: Dynamic Column Detection
  // Find the best key to display as the "Topic" in the dropdown
  const getTopicKey = () => {
    if (!syllabusItems || syllabusItems.length === 0) return "Title";

    const firstItem = syllabusItems[0];
    const keys = Object.keys(firstItem);

    // Heuristic: Look for common names for the main topic column
    // Priority: Title > Topic > Lesson > Unit > Chapter > Content Standard
    const candidates = ["Title", "title", "Topic", "topic", "Lesson", "lesson", "Unit", "unit", "Chapter", "chapter", "Content", "Standard"];

    for (const candidate of candidates) {
      // partial match check? or exact? Let's try exact first, then partial.
      const found = keys.find(k => k === candidate);
      if (found) return found;
    }

    // Try partial match if no exact match
    for (const candidate of candidates) {
      const found = keys.find(k => k.toLowerCase().includes(candidate.toLowerCase()));
      if (found) return found;
    }

    // Fallback: Return the first key that has a string value (likely text)
    const stringKey = keys.find(k => typeof firstItem[k] === 'string' && firstItem[k].length > 0);
    return stringKey || keys[0]; // Absolute fallback to first key
  };

  const topicKey = getTopicKey();

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

  // Determine if the subject is English
  // We check for "english" (case-insensitive) in the subject string
  const isEnglish = data.subject && data.subject.toLowerCase().includes("english");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    // Updated logic: check for LessonNo or Title or whatever the dynamic key is
    const hasTopicSelected = data.sow?.lessonNo || data.sow?.Title || (data.sow && Object.keys(data.sow).length > 0);

    // Basic requirements: Topic and Specific Topic are always required
    if (!hasTopicSelected && !data.specificTopic) {
      alert("Please select a topic or enter a specific topic/title.");
      return;
    }

    // Conditional requirements: English subjects strictly require these fields
    if (isEnglish) {
      if (!data.activityType || !data.proficiencyLevel || !data.hotsFocus) {
        alert("For English subjects, please fill in all fields (Activity Format, Proficiency Level, HOTS Focus).");
        return;
      }

      // Check if activity has been configured (only if activity type is selected)
      if (data.activityType && !hasConfiguredActivity) {
        alert("Please configure your selected activity type before proceeding.");
        return;
      }
    } else {
      // Non-English: These fields are optional
      // However, if they DID select an activity type, they should configure it
      if (data.activityType && !hasConfiguredActivity) {
        alert("Since you selected an Activity Format, please configure it before proceeding.");
        return;
      }
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
        return `${params.essayType || "Unknown type"} essay, ${params.wordCount || "Unknown length"
          }, ${params.duration || "Unknown duration"}`;

      case "assessment":
        return `${params.assessmentType || "Unknown type"}, ${params.numberOfQuestions || 0
          } questions, ${params.timeAllocation || "Unknown"} minutes`;

      case "activityInClass":
        return `${params.studentArrangement || "Unknown arrangement"}, ${params.resourceUsage || "Unknown resources"
          }, ${params.duration || "Unknown duration"}`;

      case "textbook":
        return `Textbook activity${params.additionalRequirement
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
      <p>Fill in the core details based on the Syllabus.</p>

      <form onSubmit={handleSubmit}>
        {/* Lesson from Syllabus */}
        <div className={styles.formGroup}>
          <label htmlFor="lessonNumber">Topic from Syllabus ({topicKey})</label>
          <select
            id="lessonNumber"
            name="lessonNumber"
            value={data.sow?.[topicKey] || ""}
            onChange={(e) => {
              const selectedValue = e.target.value;
              const selectedItem = syllabusItems.find(
                (item) => item[topicKey] === selectedValue
              );

              // We store the whole item in 'sow' to keep structure similar, or rename 'sow' to 'syllabusItem' in future
              updateData("sow", selectedItem || {});

              if (selectedItem && selectedItem[topicKey]) {
                // Auto-fill specific topic with the detected title key
                updateData("specificTopic", selectedItem[topicKey]);
              }
            }}
            disabled={isLoading}
            required
          >
            <option value="" disabled>
              -- Select Topic --
            </option>
            {isLoading && <option disabled>Loading syllabus...</option>}
            {error && <option disabled>Error: {error}</option>}
            {!isLoading && !error && syllabusItems.length === 0 && (
              <option disabled>No topics available for {data.grade}</option>
            )}
            {!isLoading &&
              !error &&
              syllabusItems.map((item, index) => (
                <option key={index} value={item[topicKey]}>
                  {index + 1}. {item[topicKey]}
                </option>
              ))}
          </select>

          <small style={{ color: "#666", marginTop: "4px", display: "block" }}>
            {data.grade
              ? `Looking for syllabus topics in ${data.grade}`
              : "Please select a class first"}
            {isLoading && " - Loading..."}
          </small>
        </div>

        {data.sow && Object.keys(data.sow).length > 0 && (
          <div style={{
            marginTop: "-10px",
            marginBottom: "20px",
            padding: "12px",
            backgroundColor: "#f9f9f9",
            borderRadius: "6px",
            border: "1px solid #e0e0e0",
            fontSize: "14px"
          }}>
            <strong style={{ display: "block", marginBottom: "8px", color: "#333" }}>Syllabus Content:</strong>
            <div style={{ display: "grid", gap: "8px" }}>
              {Object.entries(data.sow)
                .filter(([key]) => key !== topicKey && key !== "id" && key !== "_id") // Exclude title and IDs
                .map(([key, value]) => {
                  let displayValue = value;
                  if (typeof value === 'object' && value !== null) {
                    displayValue = JSON.stringify(value, null, 2);
                  }
                  return (
                    <div key={key} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "10px" }}>
                      <span style={{ fontWeight: "600", color: "#555", textTransform: "capitalize" }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span style={{ color: "#333", whiteSpace: "pre-wrap" }}>{displayValue}</span>
                    </div>
                  );
                })
              }
              {Object.keys(data.sow).filter(key => key !== topicKey && key !== "id" && key !== "_id").length === 0 && (
                <span style={{ color: "#888", fontStyle: "italic" }}>No additional content details available.</span>
              )}
            </div>
          </div>
        )}

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
          <label htmlFor="activityType">
            Primary Activity Format {isEnglish ? <span style={{ color: 'red' }}>*</span> : <span style={{ color: '#999', fontWeight: 'normal' }}>(Optional)</span>}
          </label>
          <select
            id="activityType"
            name="activityType"
            value={data.activityType || ""}
            onChange={(e) => handleActivityTypeChange(e.target.value)}
            required={isEnglish}
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
          <label htmlFor="proficiencyLevel">
            Class Proficiency Level {isEnglish ? <span style={{ color: 'red' }}>*</span> : <span style={{ color: '#999', fontWeight: 'normal' }}>(Optional)</span>}
          </label>
          <select
            id="proficiencyLevel"
            name="proficiencyLevel"
            value={data.proficiencyLevel || ""}
            onChange={(e) => updateData("proficiencyLevel", e.target.value)}
            required={isEnglish}
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
          <label htmlFor="hotsFocus">
            HOTS Focus {isEnglish ? <span style={{ color: 'red' }}>*</span> : <span style={{ color: '#999', fontWeight: 'normal' }}>(Optional)</span>}
          </label>
          <select
            id="hotsFocus"
            name="hotsFocus"
            value={data.hotsFocus || ""}
            onChange={(e) => updateData("hotsFocus", e.target.value)}
            required={isEnglish}
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
