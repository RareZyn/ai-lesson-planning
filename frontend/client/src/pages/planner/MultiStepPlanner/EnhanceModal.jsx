import React, { useState } from "react";
import styles from "./EnhanceModal.module.css"; // We will create this CSS file next

const EnhanceModal = ({
  isOpen,
  onClose,
  onSubmit,
  sectionTitle,
  isEnhancing,
}) => {
  const [prompt, setPrompt] = useState("");

  if (!isOpen) {
    return null;
  }

  const handleSubmit = () => {
    if (prompt.trim()) {
      onSubmit(prompt);
      setPrompt(""); // Clear prompt after submission
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Enhance: {sectionTitle}</h3>
          <button onClick={onClose} className={styles.closeButton}>
            &times;
          </button>
        </div>
        <div className={styles.modalBody}>
          <label htmlFor="enhancementPrompt">
            How should the AI improve this section?
          </label>
          <textarea
            id="enhancementPrompt"
            rows="4"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'Make it more interactive for 10-year-olds' or 'Add a question to check for understanding.'"
            className={styles.promptTextarea}
          />
        </div>
        <div className={styles.modalFooter}>
          <button
            onClick={onClose}
            className={styles.cancelButton}
            disabled={isEnhancing}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={styles.submitButton}
            disabled={!prompt.trim() || isEnhancing}
          >
            {isEnhancing ? "Enhancing..." : "✨ Enhance with AI"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhanceModal;