import React from 'react';
import styles from './MultiStepPlanner.module.css';

const ProgressBar = ({ currentStep, totalSteps }) => {
  const steps = [
    'Choose Class',
    'Lesson Details',
    'Additional Info',
    'Confirm Plan'
  ];

  return (
    <div className={styles.progressBar}>
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber <= currentStep;
        return (
          <React.Fragment key={stepNumber}>
            <div className={`${styles.step} ${isActive ? styles.active : ''}`}>
              <div className={styles.stepNumber}>{stepNumber}</div>
              <div className={styles.stepLabel}>{label}</div>
            </div>
            {stepNumber < totalSteps && <div className={`${styles.connector} ${isActive && stepNumber < currentStep ? styles.active : ''}`}></div>}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ProgressBar;