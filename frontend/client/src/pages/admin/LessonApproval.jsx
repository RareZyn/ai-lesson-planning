
import { useEffect, useState } from "react";
import { message, Pagination, Dropdown, Menu, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { MoreOutlined, AppstoreOutlined, ClockCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";
import {
  getAllLessonsForApproval,
  approveLesson,
  rejectLesson,
} from "../../services/adminService";
import styles from "./LessonApproval.module.css";
import dayjs from "dayjs";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import LessonStatusIcon from "../../components/LessonStatusIcon";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import CommonTable from "../../components/common/CommonTable";

const LessonApproval = () => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [remark, setRemark] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("All");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset pagination when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

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
        message.success("Lesson approved successfully!");
      } else if (actionType === "reject") {
        await rejectLesson(selectedLesson._id, remark);
        message.success("Lesson rejected successfully!");
      }
      setIsModalOpen(false);
      fetchLessons();
    } catch (error) {
      message.error(error.message);
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

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLessons = filteredLessons.slice(indexOfFirstItem, indexOfLastItem);

  if (isLoading) return <LoadingSpinner tip="Loading lessons..." />;
  if (error) return <div className={styles.statusMessage}>{error}</div>;

  return (
    <div className={styles.container}>
      {/* === TAB BAR === */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tabButton} ${activeTab === "All" ? styles.activeTab : ""
            } `}
          onClick={(e) => { e.stopPropagation(); setActiveTab("All"); }}
        >
          <AppstoreOutlined style={{ marginRight: 6 }} />
          All <span className={styles.badge}>{lessons.length}</span>
        </button>

        <button
          className={`${styles.tabButton} ${activeTab === "To Review" ? styles.activeTab : ""
            } `}
          onClick={(e) => { e.stopPropagation(); setActiveTab("To Review"); }}
        >
          <ClockCircleOutlined style={{ marginRight: 6 }} />
          To Review <span className={styles.badge}>{pendingCount}</span>
        </button>

        <button
          className={`${styles.tabButton} ${activeTab === "Processed" ? styles.activeTab : ""
            } `}
          onClick={(e) => { e.stopPropagation(); setActiveTab("Processed"); }}
        >
          <CheckCircleOutlined style={{ marginRight: 6 }} />
          Processed <span className={styles.badge}>{processedCount}</span>
        </button>
      </div>

      {/* === LESSON LIST === */}
      {/* === LESSON LIST === */}
      <CommonTable
        loading={isLoading}

        rowKey="_id"
        dataSource={currentLessons}
        columns={[
          {
            title: "Lesson Topic",
            dataIndex: "parameters",
            key: "topic",
            render: (params) => <span style={{ color: "#1890ff", fontWeight: "bold" }}>{params?.specificTopic || "Untitled"}</span>
          },
          {
            title: "Class",
            dataIndex: ["classInfo", "className"],
            key: "class"
          },
          {
            title: "Grade",
            dataIndex: ["classInfo", "grade"],
            key: "grade"
          },
          {
            title: "Subject",
            dataIndex: ["classInfo", "subject"],
            key: "subject"
          },
          {
            title: "Created By",
            dataIndex: ["createdBy", "name"],
            key: "createdBy"
          },
          {
            title: "Date",
            dataIndex: "lessonDate",
            key: "date",
            render: (date) => dayjs(date).format("MMM D, YYYY")
          },
          {
            title: "Status",
            dataIndex: "approvalStatus",
            key: "status",
            render: (status) => <LessonStatusIcon status={status} />
          },
          {
            title: "",
            key: "actions",
            width: 60,
            render: (_, lesson) => {
              if (lesson.approvalStatus?.toLowerCase() !== "pending") return null;

              const menu = (
                <Menu onClick={(e) => e.domEvent.stopPropagation()}>
                  <Menu.Item
                    key="approve"
                    icon={<FaCheckCircle style={{ color: "#28a745" }} />}
                    onClick={(e) => { e.domEvent.stopPropagation(); openModal(lesson, "approve"); }}
                  >
                    Approve
                  </Menu.Item>
                  <Menu.Item
                    key="reject"
                    icon={<FaTimesCircle style={{ color: "#dc3545" }} />}
                    onClick={(e) => { e.domEvent.stopPropagation(); openModal(lesson, "reject"); }}
                  >
                    Reject
                  </Menu.Item>
                </Menu>
              );

              return (
                <div onClick={(e) => e.stopPropagation()}>
                  <Dropdown overlay={menu} trigger={['click']}>
                    <Button icon={<MoreOutlined />} type="text" />
                  </Dropdown>
                </div>
              );
            }
          }
        ]}
        onRow={(record) => ({
          onClick: () => navigate(`/app/admin/lessons/${record._id}/review`)
        })}
        renderCard={(lesson) => {
          const menu = (
            <Menu onClick={(e) => e.domEvent.stopPropagation()}>
              <Menu.Item
                key="approve"
                icon={<FaCheckCircle style={{ color: "#28a745" }} />}
                onClick={(e) => { e.domEvent.stopPropagation(); openModal(lesson, "approve"); }}
              >
                Approve
              </Menu.Item>
              <Menu.Item
                key="reject"
                icon={<FaTimesCircle style={{ color: "#dc3545" }} />}
                onClick={(e) => { e.domEvent.stopPropagation(); openModal(lesson, "reject"); }}
              >
                Reject
              </Menu.Item>
            </Menu>
          );

          return (
            <div
              className={styles.mobileCard}
              onClick={() => navigate(`/app/admin/lessons/${lesson._id}/review`)}
            >
              {/* Header: ID/Date --- Actions */}
              <div className={styles.mobileCardHeader}>
                <span className={styles.headerLeft}>
                  {dayjs(lesson.lessonDate).format("MMM D, YYYY")}
                </span>
                <div onClick={(e) => e.stopPropagation()} className={styles.headerAction}>
                  {lesson.approvalStatus?.toLowerCase() === "pending" && (
                    <Dropdown overlay={menu} trigger={['click']}>
                      <MoreOutlined style={{ fontSize: '20px' }} />
                    </Dropdown>
                  )}
                </div>
              </div>

              <div className={styles.mobileCardBody}>
                {/* Top Row: Icon + Title --- Status */}
                <div className={styles.topRow}>
                  <div className={styles.infoSection}>
                    <div className={styles.iconCircle}>
                      {lesson.classInfo.grade?.charAt(0) || "L"}
                    </div>
                    <div className={styles.textBlock}>
                      <div className={styles.cardTitle}>
                        {lesson.parameters?.specificTopic || "Untitled"}
                      </div>
                      <div className={styles.cardSubtitle}>
                        {lesson.classInfo.subject}
                      </div>
                    </div>
                  </div>
                  <div className={styles.statusSection}>
                    <LessonStatusIcon status={lesson.approvalStatus} />
                  </div>
                </div>

                {/* Details List */}
                <div className={styles.detailsList}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Class</span>
                    <span className={styles.detailValue}>{lesson.classInfo.className}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Grade</span>
                    <span className={styles.detailValue}>{lesson.classInfo.grade}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Teacher</span>
                    <span className={styles.detailValue}>{lesson.createdBy?.name}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        }}
      />
      <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
        <Pagination
          current={currentPage}
          pageSize={itemsPerPage}
          total={filteredLessons.length}
          onChange={handlePageChange}
          showSizeChanger={false}
        />
      </div>

      {/* === CONFIRMATION MODAL === */}
      {
        isModalOpen && (
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
        )
      }
    </div >
  );
};

export default LessonApproval;
