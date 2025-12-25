import React, { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import { Modal, message } from "antd";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getLessonPlansByClass } from "../../services/lessonService";
import { getClassById, deleteClass } from "../../services/classService";
import LessonCard from "../planner/displaylesson/LessonCard";
import CreateClassModal from "./CreateClassModal";
import StudentManagementSection from "./StudentManagementSection";
import styles from "./ClassLessonsPage.module.css";

// Icons for the UI
import { ArrowBack, Edit, Delete } from "@mui/icons-material";
import { FaPlus } from "react-icons/fa";
import LoadingSpinner from "../../components/common/LoadingSpinner";

// Custom Modal Component (Same as PlannerPage)
const CustomModal = ({ isVisible, onClose, onOk, title, children }) => {
  if (!isVisible) return null;
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <button onClick={onClose} className={styles.modalCloseButton}>
            &times;
          </button>
        </div>
        <div className={styles.modalBody}>{children}</div>
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.modalButtonSecondary}>
            Cancel
          </button>
          <button onClick={onOk} className={styles.modalButtonPrimary}>
            Start Planning
          </button>
        </div>
      </div>
    </div>
  );
};

const ClassLessonsPage = () => {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [lessons, setLessons] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State to control the edit modal visibility
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // State for Create Lesson Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());

  // Fetch both class info and its associated lessons
  const fetchData = useCallback(async () => {
    if (!classId) return;
    setIsLoading(true);
    setError(null);
    try {
      // Fetch both pieces of data in parallel for better performance
      const [classResponse, lessonData] = await Promise.all([
        getClassById(classId),
        getLessonPlansByClass(classId),
      ]);
      setClassInfo(classResponse.data);
      setLessons(lessonData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handler to open the edit modal
  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  // Handler for deleting the class
  const handleDelete = () => {
    Modal.confirm({
      title: `Delete Class "${classInfo.className}"?`,
      content: "Are you sure you want to delete this class and all its lesson plans? This action cannot be undone.",
      okText: "Delete Class",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteClass(classId);
          message.success("Class and all associated lessons have been deleted successfully.");
          navigate("/app/classes"); // Navigate back to the main class list
        } catch (err) {
          message.error(`Error: ${err.message}`);
        }
      },
    });
  };

  // Callback for when the modal saves an edit successfully
  const handleEditSaveSuccess = () => {
    setIsEditModalOpen(false);
    fetchData(); // Re-fetch data to show the updated class info
  };

  // Handler to open modal instead of redirecting
  const handleCreateClick = () => {
    setIsCreateModalOpen(true);
  };

  // Confirm Create and Navigate with Date
  const handleConfirmCreate = () => {
    if (selectedDate && selectedDate.isValid()) {
      navigate("/app/planner", {
        state: {
          preselectedClass: classInfo,
          selectedDate: selectedDate.toISOString()
        }
      });
      setIsCreateModalOpen(false);
    } else {
      message.warning("Please select a valid date.");
    }
  };

  if (isLoading)
    return <LoadingSpinner tip="Loading class details..." />;
  if (error)
    return (
      <div className={`${styles.status} ${styles.error}`}>Error: {error}</div>
    );

  return (
    <div className={styles.container}>
      <Link to="/app/classes" className={styles.backButton}>
        <ArrowBack /> Back to All Classes
      </Link>

      <header className={styles.header}>
        <div className={styles.headerMain}>
          <h1>{classInfo?.className}</h1>
          <p>
            {classInfo?.subject} - Year {classInfo?.year}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={handleEdit}
            className={`${styles.actionButton} ${styles.editButton}`}
          >
            <Edit fontSize="small" /> Edit Class
          </button>
          <button
            onClick={handleDelete}
            className={`${styles.actionButton} ${styles.deleteButton}`}
          >
            <Delete fontSize="small" /> Delete Class
          </button>
        </div>
      </header>

      {/* Lessons Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Lesson Plans</h2>
        </div>

        <div className={styles.lessonsGrid}>
          {/* Create Card is always first */}
          <div
            className={styles.createCard}
            onClick={handleCreateClick}
            role="button"
            tabIndex={0}
          >
            <div className={styles.createIconWrapper}>
              <FaPlus />
            </div>
            <h3 className={styles.createCardTitle}>Create New Lesson</h3>
            <p className={styles.createCardText}>Click to schedule a date</p>
          </div>

          {lessons.map((lesson) => (
            <LessonCard key={lesson._id} lesson={lesson} />
          ))}
        </div>

        {lessons.length === 0 && (
          <div className={styles.empty} style={{ display: 'none' }}> {/* Hidden now as we have the card */}
          </div>
        )}
      </section>

      {/* Student Management Section */}
      <StudentManagementSection classId={classId} classInfo={classInfo} />

      {/* The "Create/Edit Class" modal is reused here for editing */}
      {isEditModalOpen && (
        <CreateClassModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleEditSaveSuccess}
          currentClass={classInfo}
        />
      )}

      {/* Date Selection Modal for New Lesson */}
      <CustomModal
        title="Schedule New Lesson"
        isVisible={isCreateModalOpen}
        onOk={handleConfirmCreate}
        onClose={() => setIsCreateModalOpen(false)}
      >
        <p style={{ marginBottom: '15px', color: '#666' }}>
          Choose the date for the lesson you wish to create:
        </p>
        <input
          type="date"
          value={selectedDate.format('YYYY-MM-DD')}
          onChange={(e) => setSelectedDate(dayjs(e.target.value))}
          className={styles.customDatePicker}
        />
      </CustomModal>
    </div>
  );
};

export default ClassLessonsPage;
