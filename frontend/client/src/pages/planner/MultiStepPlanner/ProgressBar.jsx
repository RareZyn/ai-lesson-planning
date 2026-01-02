import React from 'react';
import styles from './ProgressBar.module.css';

const ProgressBar = ({ currentStep, totalSteps }) => {
  const steps = [
    { number: 1, title: 'Class' },
    { number: 2, title: 'Details' },
    { number: 3, title: 'Info' },
    { number: 4, title: 'Confirm' },
  ];

  return (
    <div className={styles.progressBarContainer}>
      <div className={styles.progressBar}>
        {steps.map((step) => {
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;

          let statusClass = '';
          if (isActive) statusClass = styles.active;
          else if (isCompleted) statusClass = styles.completed;

          return (
            <div
              key={step.number}
              className={`${styles.stepChevron} ${statusClass}`}
            >
              <div className={styles.stepContentWrapper}>
                {/* Optional: Show checkmark if completed? Image shows just text.
                        If active, show text. */}
                <span className={styles.stepTitle}>{step.title}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;