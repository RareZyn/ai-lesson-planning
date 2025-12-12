import React, { useState } from "react";
import styles from "./MultiStepPlanner.module.css";

// Import the new components (you'll create these files next)
import EnhanceModal from "./EnhanceModal";
import EditableSection from "./EditableSection";

const Step4_ConfirmPlan = ({
  plan,
  updatePlan,
  onSave,
  onPrev,
  formData,
  onEnhanceSection, // New prop from parent
  isEnhancing,      // New prop from parent
}) => {
  // State to manage the enhancement modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [enhancingSection, setEnhancingSection] = useState(null); // e.g., 'learningObjective'

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

  // Handlers for the enhance feature
  const handleEnhanceClick = (sectionKey) => {
    setEnhancingSection(sectionKey);
    setIsModalOpen(true);
  };

  const handleEnhanceSubmit = (prompt) => {
    if (enhancingSection && onEnhanceSection) {
      onEnhanceSection(enhancingSection, prompt);
    }
    setIsModalOpen(false);
    setEnhancingSection(null);
  };

  // Helper to make section keys user-friendly for the modal title
  const formatSectionTitle = (key) => {
    if (!key) return "";
    const result = key.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  };



  return (
    <div className={styles.stepContent}>
      <h2>Step 4: Confirm & Edit Your Lesson Plan</h2>
      <p>
        Review the AI-generated plan below. You can edit any section or use the
        ✨ button to ask the AI for improvements.
      </p>

      {/* Activity Configuration Summary (no changes here) */}

      <div className={styles.editablePlan}>
        <EditableSection
          label="Learning Objective"
          id="learningObjective"
          value={plan.learningObjective || ""}
          onChange={(e) => updatePlan("learningObjective", e.target.value)}
          onEnhance={() => handleEnhanceClick("learningObjective")}
          rows={3}
        />

        <EditableSection
          label="Success Criteria (one per line)"
          id="successCriteria"
          value={(plan.successCriteria || []).join("\n")}
          onChange={(e) => handleArrayChange("successCriteria", e.target.value)}
          onEnhance={() => handleEnhanceClick("successCriteria")}
          rows={5}
        />

        <EditableSection
          label="Pre-Lesson / Set Induction (one activity per line)"
          id="preLesson"
          value={(plan.activities?.preLesson || []).join("\n")}
          onChange={(e) => handleActivityChange("preLesson", e.target.value)}
          onEnhance={() => handleEnhanceClick("activities.preLesson")}
          rows={4}
        />

        <EditableSection
          label="During Lesson / Main Activities (one activity per line)"
          id="duringLesson"
          value={(plan.activities?.duringLesson || []).join("\n")}
          onChange={(e) => handleActivityChange("duringLesson", e.target.value)}
          onEnhance={() => handleEnhanceClick("activities.duringLesson")}
          rows={8}
        />

        <EditableSection
          label="Post-Lesson / Closure (one activity per line)"
          id="postLesson"
          value={(plan.activities?.postLesson || []).join("\n")}
          onChange={(e) => handleActivityChange("postLesson", e.target.value)}
          onEnhance={() => handleEnhanceClick("activities.postLesson")}
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

      <EnhanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleEnhanceSubmit}
        sectionTitle={formatSectionTitle(enhancingSection?.split('.').pop())}
        isEnhancing={isEnhancing}
      />
    </div>
  );
};

export default Step4_ConfirmPlan;