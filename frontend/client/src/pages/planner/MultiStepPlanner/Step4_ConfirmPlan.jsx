import React from 'react';
import styles from './MultiStepPlanner.module.css';

const Step4_ConfirmPlan = ({ plan, updatePlan, onSave, onPrev }) => {
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

  // A helper function to handle changes in textareas that manage arrays of strings.
  const handleArrayChange = (section, value) => {
    // We update the plan by splitting the textarea content back into an array by new lines.
    updatePlan(section, value.split('\n'));
  };
  
  // A helper function for the nested 'activities' object.
  const handleActivityChange = (stage, value) => {
    const updatedActivities = {
      ...plan.activities,
      [stage]: value.split('\n')
    };
    updatePlan('activities', updatedActivities);
  };


  return (
    <div className={styles.stepContent}>
      <h2>Step 4: Confirm & Edit Your Lesson Plan</h2>
      <p>Review the AI-generated plan below. You can edit the text in any section before saving.</p>
      
      <div className={styles.editablePlan}>
        {/* --- Learning Objective --- */}
        <div className={styles.formGroup}>
          <label htmlFor="learningObjective">Learning Objective</label>
          <textarea 
            id="learningObjective" 
            value={plan.learningObjective || ''} 
            onChange={(e) => updatePlan('learningObjective', e.target.value)} 
            rows="3"
          ></textarea>
        </div>

        {/* --- Success Criteria --- */}
        <div className={styles.formGroup}>
          <label htmlFor="successCriteria">Success Criteria (one per line)</label>
          <textarea 
            id="successCriteria" 
            value={(plan.successCriteria || []).join('\n')} 
            onChange={(e) => handleArrayChange('successCriteria', e.target.value)} 
            rows="5"
          ></textarea>
        </div>
        
        {/* --- Pre-Lesson Activities --- */}
        <div className={styles.formGroup}>
          <label htmlFor="preLesson">Pre-Lesson / Set Induction (one activity per line)</label>
          <textarea 
            id="preLesson" 
            value={(plan.activities?.preLesson || []).join('\n')} 
            onChange={(e) => handleActivityChange('preLesson', e.target.value)} 
            rows="4"
          ></textarea>
        </div>
        
        {/* --- During-Lesson Activities --- */}
        <div className={styles.formGroup}>
          <label htmlFor="duringLesson">During Lesson / Main Activities (one activity per line)</label>
          <textarea 
            id="duringLesson" 
            value={(plan.activities?.duringLesson || []).join('\n')} 
            onChange={(e) => handleActivityChange('duringLesson', e.target.value)} 
            rows="8"
          ></textarea>
        </div>

        {/* --- Post-Lesson Activities --- */}
        <div className={styles.formGroup}>
          <label htmlFor="postLesson">Post-Lesson / Closure (one activity per line)</label>
          <textarea 
            id="postLesson" 
            value={(plan.activities?.postLesson || []).join('\n')} 
            onChange={(e) => handleActivityChange('postLesson', e.target.value)} 
            rows="4"
          ></textarea>
        </div>

        

      </div>
      
      <div className={styles.navigation}>
        <button type="button" onClick={onPrev} className={styles.secondaryButton}>Previous</button>
        <button type="button" onClick={onSave} className={styles.primaryButton}>Save Lesson Plan</button>
      </div>
    </div>
  );
};

export default Step4_ConfirmPlan;