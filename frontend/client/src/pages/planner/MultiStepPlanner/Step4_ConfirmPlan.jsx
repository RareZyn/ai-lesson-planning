import React, { useState } from "react";
import styles from "./MultiStepPlanner.module.css";

// Import the new components (you'll create these files next)
// EnhanceModal import removed
import EditableSection from "./EditableSection";

const Step4_ConfirmPlan = ({
  plan,
  updatePlan,
  onSave,
  onPrev,
  formData,
  onEnhanceSection,
  isEnhancing,
}) => {
  // Track which section is currently being enhanced to show specific loader
  const [activeEnchancingId, setActiveEnhancingId] = useState(null);

  // Reset active ID when enhancing stops
  React.useEffect(() => {
    if (!isEnhancing) {
      setActiveEnhancingId(null);
    }
  }, [isEnhancing]);

  if (!plan) {
    return (
      <div className={styles.stepContent}>
        <h2>Generating your plan...</h2>
        <p>Please wait a moment while the AI works its magic.</p>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  // Helper functions to handle changes
  const handleArrayChange = (section, value) => {
    updatePlan(section, value.split("\n"));
  };
  const handleActivityChange = (stage, value) => {
    const updatedActivities = { ...plan.activities, [stage]: value.split("\n") };
    updatePlan("activities", updatedActivities);
  };

  // Handler for inline enhancement submission
  const handleEnhance = (sectionKey, prompt) => {
    setActiveEnhancingId(sectionKey);
    if (onEnhanceSection) {
      onEnhanceSection(sectionKey, prompt);
    }
  };

  return (
    <div className={styles.stepContent}>
      <h2>Step 4: Confirm & Edit Your Lesson Plan</h2>
      <p>
        Review the AI-generated plan below. content. You can edit any section or use the
        AI Enhance button to improve specific parts.
      </p>

      <div className={styles.editablePlan}>
        <EditableSection
          label="Learning Objective"
          id="learningObjective"
          value={plan.learningObjective || ""}
          onChange={(e) => updatePlan("learningObjective", e.target.value)}
          onEnhance={(prompt) => handleEnhance("learningObjective", prompt)}
          isLoading={isEnhancing && activeEnchancingId === "learningObjective"}
          rows={3}
        />

        <EditableSection
          label="Success Criteria (one per line)"
          id="successCriteria"
          value={(plan.successCriteria || []).join("\n")}
          onChange={(e) => handleArrayChange("successCriteria", e.target.value)}
          onEnhance={(prompt) => handleEnhance("successCriteria", prompt)}
          isLoading={isEnhancing && activeEnchancingId === "successCriteria"}
          rows={5}
        />

        <EditableSection
          label="Pre-Lesson / Set Induction (one activity per line)"
          id="preLesson"
          value={(plan.activities?.preLesson || []).join("\n")}
          onChange={(e) => handleActivityChange("preLesson", e.target.value)}
          onEnhance={(prompt) => handleEnhance("activities.preLesson", prompt)}
          isLoading={isEnhancing && activeEnchancingId === "activities.preLesson"}
          rows={4}
        />

        <EditableSection
          label="During Lesson / Main Activities (one activity per line)"
          id="duringLesson"
          value={(plan.activities?.duringLesson || []).join("\n")}
          onChange={(e) => handleActivityChange("duringLesson", e.target.value)}
          onEnhance={(prompt) => handleEnhance("activities.duringLesson", prompt)}
          isLoading={isEnhancing && activeEnchancingId === "activities.duringLesson"}
          rows={8}
        />

        <EditableSection
          label="Post-Lesson / Closure (one activity per line)"
          id="postLesson"
          value={(plan.activities?.postLesson || []).join("\n")}
          onChange={(e) => handleActivityChange("postLesson", e.target.value)}
          onEnhance={(prompt) => handleEnhance("activities.postLesson", prompt)}
          isLoading={isEnhancing && activeEnchancingId === "activities.postLesson"}
          rows={4}
        />
      </div>

      <div className={styles.navigation}>
        <button type="button" onClick={onPrev} className={styles.secondaryButton}>
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