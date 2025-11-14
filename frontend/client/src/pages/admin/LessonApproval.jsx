import { useEffect, useState } from "react";
import {
  getAllLessonsForApproval,
  approveLesson,
  rejectLesson,
} from "../../services/adminService";
import styles from "./LessonApproval.module.css";
import dayjs from "dayjs";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import LessonStatusIcon from "../../components/LessonStatusIcon";

const LessonApproval = () => {
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [remark, setRemark] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("All");

  // === FETCH ALL LESSONS ===
  const fetchLessons = async () => {
    setIsLoading(true);
    try {
      const data = await getAllLessonsForApproval();
      setLessons(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      setError("Failed to load lessons.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  // === MODAL HANDLING ===
  const openModal = (lesson, type) => {
    setSelectedLesson(lesson);
    setActionType(type);
    setRemark("");
    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedLesson) return;

    try {
      if (actionType === "approve") {
        await approveLesson(selectedLesson._id, { remark });
        alert("Lesson approved successfully!");
      } else if (actionType === "reject") {
        await rejectLesson(selectedLesson._id, { remark });
        alert("Lesson rejected successfully!");
      }
      setIsModalOpen(false);
      fetchLessons();
    } catch (error) {
      alert(error.message);
    }
  };

  // === COUNT LOGIC FOR BADGES ===
  const pendingCount = lessons.filter(
    (l) => l.approvalStatus?.toLowerCase() === "pending"
  ).length;
  const processedCount = lessons.filter(
    (l) =>
      l.approvalStatus?.toLowerCase() === "approved" ||
      l.approvalStatus?.toLowerCase() === "rejected"
  ).length;

  // === FILTERING BASED ON ACTIVE TAB ===
  const filteredLessons = lessons.filter((lesson) => {
    const status = lesson.approvalStatus?.toLowerCase();
    if (activeTab === "All") return true;
    if (activeTab === "To Review") return status === "pending";
    if (activeTab === "Processed")
      return status === "approved" || status === "rejected";
    return true;
  });

  if (isLoading) return <div className={styles.statusMessage}>Loading lessons...</div>;
  if (error) return <div className={styles.statusMessage}>{error}</div>;

  return (
    <div className={styles.container}>
      {/* === TAB BAR === */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tabButton} ${
            activeTab === "All" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("All")}
        >
          All <span className={styles.badge}>{lessons.length}</span>
        </button>

        <button
          className={`${styles.tabButton} ${
            activeTab === "To Review" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("To Review")}
        >
          To Review <span className={styles.badge}>{pendingCount}</span>
        </button>

        <button
          className={`${styles.tabButton} ${
            activeTab === "Processed" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("Processed")}
        >
          Processed <span className={styles.badge}>{processedCount}</span>
        </button>
      </div>

      {/* === LESSON LIST === */}
      {filteredLessons.length === 0 ? (
        <div className={styles.statusMessage}>No lessons found for this category.</div>
      ) : (
        <div className={styles.lessonList}>
          <div className={`${styles.listItem} ${styles.listHeader}`}>
            <div>Lesson Topic</div>
            <div>Class</div>
            <div>Grade</div>
            <div>Subject</div>
            <div>Created By</div>
            <div>Date</div>
            <div>Status</div>
          </div>

          {filteredLessons.map((lesson) => (
            <div key={lesson._id} className={styles.listItem}>
              <div>{lesson.parameters?.specificTopic || "Untitled"}</div>
              <div>{lesson.classInfo.className}</div>
              <div>{lesson.classInfo.grade}</div>
              <div>{lesson.classInfo.subject}</div>
              <div>{lesson.createdBy?.name}</div>
              <div>{dayjs(lesson.lessonDate).format("MMM D, YYYY")}</div>
              <div>
                <LessonStatusIcon status={lesson.approvalStatus} />
              </div>

              <div className={styles.listActions}>
                {lesson.approvalStatus?.toLowerCase() === "pending" && (
                  <>
                    <FaCheckCircle
                      title="Approve Lesson"
                      onClick={() => openModal(lesson, "approve")}
                      className={styles.actionButton}
                      style={{ color: "#28a745" }}
                    />
                    <FaTimesCircle
                      title="Reject Lesson"
                      onClick={() => openModal(lesson, "reject")}
                      className={styles.actionButton}
                      style={{ color: "#dc3545" }}
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === CONFIRMATION MODAL === */}
      {isModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <h3>
              {actionType === "approve"
                ? "Approve Lesson Plan"
                : "Reject Lesson Plan"}
            </h3>
            <p>
              Are you sure you want to{" "}
              <b>{actionType === "approve" ? "approve" : "reject"}</b> this
              lesson?
            </p>
            <p className={styles.modalLessonTitle}>
              <strong>Topic:</strong>{" "}
              {selectedLesson?.parameters?.specificTopic || "Untitled"}
            </p>

            <textarea
              placeholder="Optional remark..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className={styles.remarkInput}
            />

            <div className={styles.modalButtons}>
              <button
                onClick={() => setIsModalOpen(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={
                  actionType === "approve"
                    ? styles.approveButton
                    : styles.rejectButton
                }
              >
                {actionType === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonApproval;
