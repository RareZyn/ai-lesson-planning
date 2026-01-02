import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './PlannerPage.module.css';
import CalendarView from './CalendarView';
import LessonCard from '../displaylesson/LessonCard';
import MaterialManagement from '../../material/MaterialManagement';
import {
  getAllLessonPlans,
} from '../../../services/lessonService';
import { sendLessonForApproval } from '../../../services/adminService';
import { useNavigate } from 'react-router-dom';
import LessonStatusIcon from '../../../components/LessonStatusIcon.jsx';

import { FaPlus, FaSearch, FaTh, FaBars } from 'react-icons/fa';
import dayjs from 'dayjs';
import { Modal as AntModal, message, Pagination, Dropdown, Menu } from 'antd';
import { ExclamationCircleOutlined, MoreOutlined, BookOutlined, CalendarOutlined, FileTextOutlined } from '@ant-design/icons';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import CommonTable from '../../../components/common/CommonTable';

const CreateLessonCard = ({ showModal }) => (
  <div
    className={styles.createCard}
    onClick={showModal}
    role="button"
    tabIndex={0}
    onKeyPress={(e) => {
      if (e.key === "Enter" || e.key === " ") showModal();
    }}
  >
    <div className={styles.createIconWrapper}>
      <FaPlus />
    </div>
    <h3 className={styles.createCardTitle}>Create New Lesson</h3>
    <p className={styles.createCardText}>Click to schedule a date</p>
  </div>
);

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

const PlannerPage = () => {
  const [activeTab, setActiveTab] = useState('lessons');
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState(null);
  const [filterClass, setFilterClass] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filteredLessons, setFilteredLessons] = useState([]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedNewDate, setSelectedNewDate] = useState(dayjs());

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchLessons = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedLessons = await getAllLessonPlans();
      setLessons(fetchedLessons);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'lessons') {
      fetchLessons();
    }
  }, [activeTab, fetchLessons]);

  const uniqueSubjects = useMemo(() => {
    const subjects = lessons.map(l => l.classId?.subject).filter(Boolean);
    return [...new Set(subjects)];
  }, [lessons]);

  const uniqueClasses = useMemo(() => {
    const classes = lessons.map(l => l.classId?.className).filter(Boolean);
    return [...new Set(classes)];
  }, [lessons]);

  const uniqueStatuses = useMemo(() => {
    const statuses = lessons.map(l => l.approvalStatus).filter(Boolean);
    return [...new Set(statuses)];
  }, [lessons]);

  useEffect(() => {
    let results = lessons;
    if (filterSubject) {
      results = results.filter(l => l.classId?.subject === filterSubject);
    }
    if (filterClass) {
      results = results.filter(l => l.classId?.className === filterClass);
    }
    if (filterStatus) {
      results = results.filter(l => l.approvalStatus === filterStatus);
    }
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      results = results.filter(l => {
        const title = l.parameters?.specificTopic || l.parameters?.sow?.topic || l.title || '';
        const subject = l.classId?.subject || '';
        const className = l.classId?.className || '';
        return (
          title.toLowerCase().includes(lowerSearch) ||
          subject.toLowerCase().includes(lowerSearch) ||
          className.toLowerCase().includes(lowerSearch)
        );
      });
    }
    setFilteredLessons(results);
    setCurrentPage(1); // Reset to first page on filter change
  }, [lessons, searchTerm, filterSubject, filterClass, filterStatus]);

  const showModal = () => setIsModalVisible(true);
  const handleCancel = () => setIsModalVisible(false);
  const onDateChange = (date) => setSelectedNewDate(date);

  const handleCreateLesson = () => {
    if (selectedNewDate && selectedNewDate.isValid()) {
      navigate('/app/planner', {
        state: { selectedDate: selectedNewDate.toISOString() }
      });
      setIsModalVisible(false);
    } else {
      message.warning("Please select a valid date.");
    }
  };



  const renderListView = () => {
    if (filteredLessons.length === 0 && (searchTerm || filterSubject)) {
      return (
        <div className={styles.statusMessage}>
          No lessons found matching your criteria.
        </div>
      );
    }



    const handleSendForApprovalClick = async (lessonId, lessonTopic) => {
      console.log("Draft clicked for:", lessonId);

      AntModal.confirm({
        title: 'Send for Approval',
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            <p>Send this lesson plan for approval?</p>
            {lessonTopic && (
              <p className="mb-0">
                <strong>Topic:</strong> {lessonTopic}
              </p>
            )}
          </div>
        ),
        okText: 'Send',
        okType: 'primary',
        cancelText: 'Cancel',
        onOk: async () => {
          try {
            await sendLessonForApproval(lessonId);
            await fetchLessons();
            message.success("Lesson plan sent for approval!");
          } catch (error) {
            message.error(error.message || "Failed to send for approval");
          }
        },
      });
    };



    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredLessons.slice(indexOfFirstItem, indexOfLastItem);

    return (
      <div className={styles.lessonList} style={{ display: 'block' }}> {/* Keep container for layout if needed, or remove if CommonTable handles it. CommonTable has its own container. */}
        <CommonTable
          loading={isLoading}
          dataSource={currentItems}
          rowKey="_id"

          columns={[
            {
              title: "Lesson Topic",
              dataIndex: "parameters",
              key: "topic",
              render: (params) => params?.specificTopic || "Untitled Lesson"
            },
            {
              title: "Class",
              key: "class",
              render: (text, record) => record.classId?.className || "Unknown Class"
            },
            {
              title: "Subject",
              key: "subject",
              render: (text, record) => record.classId?.subject || "General"
            },
            {
              title: "Scheduled Date",
              dataIndex: "lessonDate",
              key: "date",
              render: (date) => dayjs(date).format("MMM D, YYYY")
            },
            {
              title: "Status",
              dataIndex: "approvalStatus",
              key: "status",
              render: (status, lesson) => (
                <div onClick={(e) => e.stopPropagation()}>
                  {status === "draft" ? (
                    <LessonStatusIcon
                      status="draft"
                      onClick={() => handleSendForApprovalClick(lesson._id, lesson.parameters?.specificTopic)}
                    />
                  ) : (
                    <LessonStatusIcon status={status} />
                  )}
                </div>
              )
            }
          ]}
          onRow={(record) => ({
            onClick: () => navigate(`/app/lessons/${record._id}`)
          })}
          renderCard={(lesson) => {
            const menu = (
              <Menu onClick={(e) => e.domEvent.stopPropagation()}>
                {lesson.approvalStatus === "draft" && (
                  <Menu.Item
                    key="approve"
                    onClick={(e) => {
                      e.domEvent.stopPropagation();
                      handleSendForApprovalClick(lesson._id, lesson.parameters?.specificTopic);
                    }}
                  >
                    Send for Approval
                  </Menu.Item>
                )}
                <Menu.Item
                  key="view"
                  onClick={(e) => {
                    e.domEvent.stopPropagation();
                    navigate(`/app/lessons/${lesson._id}`);
                  }}
                >
                  View Details
                </Menu.Item>
              </Menu>
            );

            return (
              <div
                className={styles.mobileCard}
                onClick={() => navigate(`/app/lessons/${lesson._id}`)}
              >
                {/* Header: Date --- Actions */}
                <div className={styles.mobileCardHeader}>
                  <span className={styles.headerLeft}>
                    {dayjs(lesson.lessonDate).format("MMM D, YYYY")}
                  </span>
                  <div onClick={(e) => e.stopPropagation()} className={styles.headerAction}>
                    <Dropdown overlay={menu} trigger={['click']}>
                      <MoreOutlined style={{ fontSize: '20px' }} />
                    </Dropdown>
                  </div>
                </div>

                <div className={styles.mobileCardBody}>
                  {/* Top Row: Icon + Title --- Status */}
                  <div className={styles.topRow}>
                    <div className={styles.infoSection}>
                      <div className={styles.iconCircle}>
                        {/* Use first letter of Subject (or 'L') */}
                        {lesson.classId?.subject ? lesson.classId.subject.charAt(0).toUpperCase() : <BookOutlined />}
                      </div>
                      <div className={styles.textBlock}>
                        <div className={styles.cardTitle}>
                          {lesson.parameters?.specificTopic || "Untitled Lesson"}
                        </div>
                        <div className={styles.cardSubtitle}>
                          {lesson.classId?.subject || "General"}
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
                      <span className={styles.detailValue}>
                        {lesson.classId?.className || "—"}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Created By</span>
                      <span className={styles.detailValue}>
                        {lesson.createdBy?.name || "Me"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <Pagination
            current={currentPage}
            pageSize={itemsPerPage}
            total={filteredLessons.length}
            onChange={handlePageChange}
            showSizeChanger={false}
          />
        </div>
      </div>
    );
  };


  const renderAllLessonsContent = () => {
    if (isLoading) return <LoadingSpinner tip="Loading your lessons..." />;
    if (error) return <div className={styles.statusMessage_error}>{error}</div>;
    if (viewMode === 'list') return renderListView();

    // Pagination Logic for Grid View (reusing calculated slices if moved up, or recalculating locally if cleaner scope-wise)
    // Since renderListView is separate, let's keep logic here too or refactor currentItems calculation to outer scope.
    // Refactoring to outer scope (renderAllLessonsContent) is better to sharing calculation.
    // Let's verify where renderListView is called. It is called inside renderAllLessonsContent.

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredLessons.slice(indexOfFirstItem, indexOfLastItem);

    return (
      <div className={styles.lessonsGrid}>


        <CreateLessonCard showModal={showModal} />
        {currentItems.length > 0 ? (
          currentItems.map((lesson) => (
            <LessonCard key={lesson._id} lesson={lesson} />
          ))
        ) : (
          <div className={styles.statusMessage_empty}>
            <h3>No Lesson Plans Found</h3>
            <p>Start by scheduling your first lesson above or adjust your search filters.</p>
          </div>
        )}

        {filteredLessons.length > itemsPerPage && (
          <div style={{
            gridColumn: '1 / -1',
            display: 'flex',
            justifyContent: 'center',
            marginTop: '20px',
            width: '100%'
          }}>
            <Pagination
              current={currentPage}
              pageSize={itemsPerPage}
              total={filteredLessons.length}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        )}
      </div>
    );
  };

  /* Updated Tabs with Icons */
  const tabs = [
    { id: 'lessons', label: 'My Lessons', icon: <BookOutlined style={{ fontSize: '1.1rem' }} /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarOutlined style={{ fontSize: '1.1rem' }} /> },
    { id: 'materials', label: 'Materials', icon: <FileTextOutlined style={{ fontSize: '1.1rem' }} /> },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.tabsContainer}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>


      </header>

      {activeTab === 'lessons' && (
        <div className={styles.controlBarWrapper}>
          {/* 1. Search Bar (Standalone) */}
          <div className={styles.customSearchBar}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search lessons, subjects, or classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* 2. Filter + Toggle Group */}
          <div className={styles.filterToggleGroup}>
            <div className={styles.activeFilters}>
              {/* Subject Filter */}
              <select
                value={filterSubject || ''}
                onChange={(e) => setFilterSubject(e.target.value || null)}
                className={`${styles.customSelect} ${styles.filterSelect}`}
              >
                <option value="">Subject</option>
                {uniqueSubjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>

              {/* Class Filter */}
              <select
                value={filterClass || ''}
                onChange={(e) => setFilterClass(e.target.value || null)}
                className={`${styles.customSelect} ${styles.filterSelect}`}
              >
                <option value="">Class</option>
                {uniqueClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus || ''}
                onChange={(e) => setFilterStatus(e.target.value || null)}
                className={`${styles.customSelect} ${styles.filterSelect}`}
              >
                <option value="">Status</option>
                {uniqueStatuses.map(st => (
                  <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>
                ))}
              </select>

              {/* Reset Filters (Optional but good UX) */}
              {(filterSubject || filterClass || filterStatus) && (
                <button
                  className={styles.resetButton}
                  onClick={() => {
                    setFilterSubject(null);
                    setFilterClass(null);
                    setFilterStatus(null);
                    setSearchTerm('');
                  }}
                  title="Clear all filters"
                >
                  &times;
                </button>
              )}
            </div>

            <div className={styles.viewToggle}>
              <button
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? styles.active : ''}
                title="Grid View"
              >
                <FaTh />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? styles.active : ''}
                title="List View"
              >
                <FaBars />
              </button>
            </div>
          </div>
        </div>
      )}

      <main className={styles.tabContent}>
        {activeTab === 'lessons' && renderAllLessonsContent()}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'materials' && <MaterialManagement />}
      </main>

      <CustomModal
        title="Schedule New Lesson"
        isVisible={isModalVisible}
        onOk={handleCreateLesson}
        onClose={handleCancel}
      >
        <p style={{ marginBottom: '15px' }}>
          Choose the date for the lesson you wish to create:
        </p>
        <input
          type="date"
          value={selectedNewDate.format('YYYY-MM-DD')}
          onChange={(e) => onDateChange(dayjs(e.target.value))}
          className={styles.customDatePicker}
        />
      </CustomModal>
    </div>
  );
};

export default PlannerPage;
