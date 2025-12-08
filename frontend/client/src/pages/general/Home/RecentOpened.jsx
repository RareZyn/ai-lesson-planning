import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "./RecentOpened.css";
import { getRecentLessonPlans } from "../../../services/lessonService";
import LessonCard from "../../planner/displaylesson/LessonCard";
import { FaPlus } from "react-icons/fa";

const CreateLessonCard = ({ onClick }) => (
  <div
    className="add-lesson-card"
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyPress={(e) => {
      if (e.key === "Enter" || e.key === " ") onClick();
    }}
  >
    <div className="add-icon-wrapper">
      <FaPlus />
    </div>
    <h3 className="add-card-title">Create New Lesson</h3>
    <p className="add-card-text">Click to schedule</p>
  </div>
);

// Reusing the CustomModal style logic from PlannerPage.
const CustomModal = ({ isVisible, onClose, onOk, title, children }) => {
  if (!isVisible) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="modal-close-button">
            &times;
          </button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button onClick={onClose} className="modal-button-secondary">
            Cancel
          </button>
          <button onClick={onOk} className="modal-button-primary">
            Start Planning
          </button>
        </div>
      </div>
    </div>
  );
};

const RecentOpened = () => {
  const navigate = useNavigate();

  const [recentItems, setRecentItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedNewDate, setSelectedNewDate] = useState(dayjs());

  useEffect(() => {
    const fetchRecent = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getRecentLessonPlans();
        setRecentItems(data);
      } catch (error) {
        console.error("Could not fetch recent lessons:", error);
        setError("Failed to load recent lessons.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecent();
  }, []);

  const handleViewAll = () => {
    navigate("/app/lessons");
  };

  const handleCreateLessonClick = () => {
    setIsModalVisible(true);
  };

  const handleConfirmCreate = () => {
    if (selectedNewDate && selectedNewDate.isValid()) {
      navigate('/app/planner', {
        state: { selectedDate: selectedNewDate.toISOString() }
      });
      setIsModalVisible(false);
    } else {
      alert("Please select a valid date.");
    }
  };

  const onDateChange = (date) => setSelectedNewDate(date);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="recent-opened-grid">
          <div className="recent-card-skeleton"></div>
          <div className="recent-card-skeleton"></div>
          <div className="recent-card-skeleton"></div>
          <div className="recent-card-skeleton"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <p className="text-danger">{error}</p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      );
    }

    return (
      <div className="recent-opened-grid">
        <CreateLessonCard onClick={handleCreateLessonClick} />
        {recentItems.map((item) => (
          <LessonCard key={item._id} lesson={item} isRecent={true} />
        ))}
      </div>
    );
  };

  return (
    <div className="recent-opened-container">
      <div className="recent-header">
        <h2 className="recent-opened-title">Recent Lessons</h2>
        {recentItems.length > 0 && (
          <button
            className="btn btn-link p-0 view-all-btn"
            onClick={handleViewAll}
            aria-label="View all lessons"
          >
            View All
            <span className="arrow ms-1" aria-hidden="true">
              ›
            </span>
          </button>
        )}
      </div>

      {renderContent()}

      <CustomModal
        title="Schedule New Lesson"
        isVisible={isModalVisible}
        onOk={handleConfirmCreate}
        onClose={() => setIsModalVisible(false)}
      >
        <p style={{ marginBottom: '15px' }}>
          Choose the date for the lesson you wish to create:
        </p>
        <input
          type="date"
          value={selectedNewDate.format('YYYY-MM-DD')}
          onChange={(e) => onDateChange(dayjs(e.target.value))}
          className="custom-date-picker"
        />
      </CustomModal>
    </div>
  );
};

export default RecentOpened;