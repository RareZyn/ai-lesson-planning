import React from "react";
import { Edit3, Clock, CheckCircle, XCircle } from "lucide-react";
import styles from "./LessonStatusIcon.module.css"; // optional for hover effects

const LessonStatusIcon = ({ status, onClick, disableClick = false }) => {
  const config = {
    draft: {
      icon: <Edit3 className={`${styles.icon} ${styles.draft}`} size={20} />,
      label: "Draft (Click to send for approval)",
      desc: "Draft"
    },
    pending: {
      icon: <Clock className={`${styles.icon} ${styles.pending}`} size={20} />,
      label: "Pending Approval",
      desc: "Pending"
    },
    approved: {
      icon: <CheckCircle className={`${styles.icon} ${styles.approved}`} size={20} />,
      label: "Approved",
      desc: "'Approved"
    },
    rejected: {
      icon: <XCircle className={`${styles.icon} ${styles.rejected}`} size={20} />,
      label: "Rejected",
      desc: "Rejected"
    },
  };

  const { icon, label, desc } = config[status] || config.draft;

  return (
    <div
      className={styles.statusWrapper}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        if (status === "draft" && onClick) onClick();
      }}
    >
      {icon}
      <span>{desc}</span>
    </div>
  );
};

export default LessonStatusIcon;
