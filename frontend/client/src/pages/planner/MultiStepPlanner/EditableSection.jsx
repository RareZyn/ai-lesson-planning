import React from "react";
import styles from "./MultiStepPlanner.module.css"; // Use existing styles

const EditableSection = ({
  label,
  id,
  value,
  onChange,
  onEnhance,
  rows,
}) => {
  return (
    <div className={`${styles.formGroup} ${styles.editableSection}`}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.textareaWrapper}>
        <textarea id={id} value={value} onChange={onChange} rows={rows} />
        <button
          type="button"
          className={styles.enhanceButton}
          onClick={onEnhance}
          title="Enhance this section with AI"
        >
          ✨
        </button>
      </div>
    </div>
  );
};

export default EditableSection;