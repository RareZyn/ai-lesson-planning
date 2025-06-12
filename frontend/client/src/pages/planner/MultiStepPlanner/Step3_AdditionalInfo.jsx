import React from 'react';
import styles from './MultiStepPlanner.module.css';

const Step3_AdditionalInfo = ({ data, updateData, onGenerate, onPrev, isLoading }) => {
  return (
    <div className={styles.stepContent}>
      <h2>Step 3: Additional Information</h2>
      <p>Add any specific requests, notes, or materials you want the AI to consider.</p>
      
      <div className={styles.formGroup}>
        <label htmlFor="additionalNotes">Your Notes (Optional)</label>
        <textarea id="additionalNotes" value={data.additionalNotes} onChange={(e) => updateData('additionalNotes', e.target.value)} rows="6" placeholder="e.g., 'Please include a fun game for the post-lesson activity. Some students are weak in grammar.'"></textarea>
      </div>

      <div className={styles.navigation}>
        <button onClick={onPrev} className={styles.secondaryButton} disabled={isLoading}>Previous</button>
        <button onClick={onGenerate} className={styles.generateButton} disabled={isLoading}>
          {isLoading ? 'Generating...' : '✨ Generate Lesson Plan'}
        </button>
      </div>
    </div>
  );
};

export default Step3_AdditionalInfo;