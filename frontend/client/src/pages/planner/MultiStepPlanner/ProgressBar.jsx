import React from 'react';
import styles from './ProgressBar.module.css';

const ProgressBar = ({ currentStep, totalSteps }) => {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
  
  const steps = [
    { number: 1, title: 'Class' },
    { number: 2, title: 'Details' },
    { number: 3, title: 'Info' },
    { number: 4, title: 'Confirm' },
  ];

  return (
    <div className={styles.progressBarContainer}>
      <div className={styles.progressBar}>
        <div 
          className={styles.progress} 
          style={{ width: `${progressPercentage}%` }}
        ></div>
        {steps.map((step) => (
          <div 
            key={step.number} 
            className={`${styles.step} ${currentStep >= step.number ? styles.active : ''}`}
          >
            <div className={styles.stepNumber}>{step.number}</div>
            <div className={styles.stepTitle}>{step.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;