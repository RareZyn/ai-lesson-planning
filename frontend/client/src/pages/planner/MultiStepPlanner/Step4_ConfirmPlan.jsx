import React from 'react';
import styles from './MultiStepPlanner.module.css';

const Step4_ConfirmPlan = ({ plan, updatePlan, onSave, onPrev }) => {
  if (!plan) {
    return (
      <div className={styles.stepContent}>
        <h2>Generating your plan...</h2>
        <p>Please wait a moment.</p>
      </div>
    );
  }

  return (
    <div className={styles.stepContent}>
      <h2>Step 4: Confirm & Edit Your Lesson Plan</h2>
      <p>Review the AI-generated plan. You can edit the text in any section before saving.</p>
      
      <div className={styles.editablePlan}>
        <div className={styles.formGroup}>
          <label htmlFor="preLesson">Pre-Lesson / Set Induction</label>
          <textarea id="preLesson" value={plan.preLesson} onChange={(e) => updatePlan('preLesson', e.target.value)} rows="5"></textarea>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="lessonDelivery">Lesson Delivery</label>
          <textarea id="lessonDelivery" value={plan.lessonDelivery} onChange={(e) => updatePlan('lessonDelivery', e.target.value)} rows="10"></textarea>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="postLesson">Post-Lesson / Closure</label>
          <textarea id="postLesson" value={plan.postLesson} onChange={(e) => updatePlan('postLesson', e.target.value)} rows="5"></textarea>
        </div>
      </div>
      
      <div className={styles.navigation}>
        <button onClick={onPrev} className={styles.secondaryButton}>Previous</button>
        <button onClick={onSave} className={styles.primaryButton}>Save Lesson Plan</button>
      </div>
    </div>
  );
};

export default Step4_ConfirmPlan;