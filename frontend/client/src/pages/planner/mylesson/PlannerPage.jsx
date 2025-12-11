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
import { Modal as AntModal, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

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
  const [filteredLessons, setFilteredLessons] = useState([]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedNewDate, setSelectedNewDate] = useState(dayjs());

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

  useEffect(() => {
    let results = lessons;
    if (filterSubject) {
      results = results.filter(l => l.classId?.subject === filterSubject);
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
  }, [lessons, searchTerm, filterSubject]);

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

    const ListHeader = () => (
      <div
        className={`${styles.listItem} ${styles.listHeader}`}
        style={{ fontWeight: 700, cursor: "default", background: "#f9f9f9" }}
      >
        <div className={styles.listTitle}>Lesson Topic</div>
        <div className={styles.listDetail}>Class</div>
        <div className={styles.listDetail}>Subject</div>
        <div className={styles.listMeta}>Scheduled Date</div>
        <div className={styles.listMeta}>Status</div>
      </div>
    );

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



    return (
      <div className={styles.lessonList}>
        {ListHeader()}
        {filteredLessons.map((lesson) => (
          <div
            key={lesson._id}
            className={styles.listItem}
            onClick={() => navigate(`/app/lessons/${lesson._id}`)}
          >
            <div className={styles.listTitle}>
              {lesson.parameters?.specificTopic || "Untitled Lesson"}
            </div>
            <div className={styles.listDetail}>{lesson.classId?.className || "N/A"}</div>
            <div className={styles.listDetail}>{lesson.classId?.subject || "N/A"}</div>
            <div className={styles.listMeta}>
              {dayjs(lesson.lessonDate).format("MMM D, YYYY")}
            </div>
            <div
              className={styles.listMeta}
              onClick={(e) => e.stopPropagation()} // Still good to stop propagation here
            >
              {lesson.approvalStatus === "draft" ? (
                // Directly render LessonStatusIcon and pass the handler to it
                <LessonStatusIcon
                  status="draft"
                  onClick={() => handleSendForApprovalClick(lesson._id, lesson.parameters?.specificTopic)} // Pass the handler
                // Note: We pass null for the event because LessonStatusIcon's internal handler
                // already calls stopPropagation. If you needed the event object here for something,
                // you'd modify LessonStatusIcon to pass it up.
                />
              ) : (
                <LessonStatusIcon status={lesson.approvalStatus} />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };


  const renderAllLessonsContent = () => {
    if (isLoading) return <div className={styles.statusMessage}>Loading your lessons...</div>;
    if (error) return <div className={styles.statusMessage_error}>{error}</div>;
    if (viewMode === 'list') return renderListView();

    return (
      <div className={styles.lessonsGrid}>
        <CreateLessonCard showModal={showModal} />
        {filteredLessons.length > 0 ? (
          filteredLessons.map((lesson) => (
            <LessonCard key={lesson._id} lesson={lesson} />
          ))
        ) : (
          <div className={styles.statusMessage_empty}>
            <h3>No Lesson Plans Found</h3>
            <p>Start by scheduling your first lesson above or adjust your search filters.</p>
          </div>
        )}
      </div>
    );
  };

  const tabs = [
    { id: 'lessons', label: 'My Lessons' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'materials', label: 'Materials' },
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
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab !== 'lessons' && (
          <button onClick={showModal} className={styles.createLessonButton}>
            <FaPlus style={{ marginRight: '8px' }} />
            Create New Lesson
          </button>
        )}
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
            <select
              value={filterSubject || ''}
              onChange={(e) => setFilterSubject(e.target.value || null)}
              className={`${styles.customSelect} ${styles.subjectFilter}`}
            >
              <option value="">Filter by Subject</option>
              {uniqueSubjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>

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
