import React from "react";
import styles from "./MultiStepPlanner.module.css";

const Step4_ConfirmPlan = ({ plan, updatePlan, onSave, onPrev, formData }) => {
  // Loading state: If the plan hasn't been generated yet, show a message.
  if (!plan) {
    return (
      <div className={styles.stepContent}>
        <h2>Generating your plan...</h2>
        <p>Please wait a moment while the AI works its magic.</p>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  // Helper function to handle changes in textareas that manage arrays of strings.
  const handleArrayChange = (section, value) => {
    updatePlan(section, value.split("\n"));
  };

  // Helper function for the nested 'activities' object.
  const handleActivityChange = (stage, value) => {
    const updatedActivities = {
      ...plan.activities,
      [stage]: value.split("\n"),
    };
    updatePlan("activities", updatedActivities);
  };

  // Helper function to get activity type label
  const getActivityTypeLabel = (type) => {
    const labels = {
      textbook: "Textbook-based Activity",
      essay: "Essay Writing",
      activityInClass: "In-class Activity",
      assessment: "Assessment / Test",
    };
    return labels[type] || type;
  };

  // Helper function to get configuration summary
  const getConfigurationSummary = () => {
    if (!formData?.activityConfiguration?.parameters) return "Not configured";

    const params = formData.activityConfiguration.parameters;
    const type = formData.activityType;

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

      default:
        return "Configured";
    }
  };

  return (
    <div className={styles.stepContent}>
      <h2>Step 4: Confirm & Edit Your Lesson Plan</h2>
      <p>
        Review the AI-generated plan below. You can edit the text in any section
        before saving.
      </p>

      {/* Activity Configuration Summary */}
      {formData?.activityConfiguration && (
        <div
          style={{
            marginBottom: "24px",
            padding: "16px",
            backgroundColor: "#f6ffed",
            border: "1px solid #b7eb8f",
            borderRadius: "8px",
          }}
        >
          <h3
            style={{
              margin: "0 0 8px 0",
              fontSize: "16px",
              color: "#52c41a",
            }}
          >
            📋 Activity Configuration Saved
          </h3>
          <div
            style={{
              fontSize: "14px",
              color: "#666",
              marginBottom: "4px",
            }}
          >
            <strong>Activity Type:</strong>{" "}
            {getActivityTypeLabel(formData.activityType)}
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "#888",
            }}
          >
            <strong>Configuration:</strong> {getConfigurationSummary()}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#999",
              marginTop: "8px",
            }}
          >
            This configuration will be used when creating assessments from this
            lesson plan.
          </div>
        </div>
      )}

      <div className={styles.editablePlan}>
        {/* Learning Objective */}
        <div className={styles.formGroup}>
          <label htmlFor="learningObjective">Learning Objective</label>
          <textarea
            id="learningObjective"
            value={plan.learningObjective || ""}
            onChange={(e) => updatePlan("learningObjective", e.target.value)}
            rows="3"
          />
        </div>

        {/* Success Criteria */}
        <div className={styles.formGroup}>
          <label htmlFor="successCriteria">
            Success Criteria (one per line)
          </label>
          <textarea
            id="successCriteria"
            value={(plan.successCriteria || []).join("\n")}
            onChange={(e) =>
              handleArrayChange("successCriteria", e.target.value)
            }
            rows="5"
          />
        </div>

        {/* Pre-Lesson Activities */}
        <div className={styles.formGroup}>
          <label htmlFor="preLesson">
            Pre-Lesson / Set Induction (one activity per line)
          </label>
          <textarea
            id="preLesson"
            value={(plan.activities?.preLesson || []).join("\n")}
            onChange={(e) => handleActivityChange("preLesson", e.target.value)}
            rows="4"
          />
        </div>

        {/* During-Lesson Activities */}
        <div className={styles.formGroup}>
          <label htmlFor="duringLesson">
            During Lesson / Main Activities (one activity per line)
          </label>
          <textarea
            id="duringLesson"
            value={(plan.activities?.duringLesson || []).join("\n")}
            onChange={(e) =>
              handleActivityChange("duringLesson", e.target.value)
            }
            rows="8"
          />
        </div>

        {/* Post-Lesson Activities */}
        <div className={styles.formGroup}>
          <label htmlFor="postLesson">
            Post-Lesson / Closure (one activity per line)
          </label>
          <textarea
            id="postLesson"
            value={(plan.activities?.postLesson || []).join("\n")}
            onChange={(e) => handleActivityChange("postLesson", e.target.value)}
            rows="4"
          />
        </div>
      </div>

      <div className={styles.navigation}>
        <button
          type="button"
          onClick={onPrev}
          className={styles.secondaryButton}
        >
          Previous
        </button>
        <button type="button" onClick={onSave} className={styles.primaryButton}>
          Save Lesson Plan
        </button>
      </div>
    </div>
  );
};

export default Step4_ConfirmPlan;
