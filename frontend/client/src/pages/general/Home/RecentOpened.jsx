import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./RecentOpened.css";
import { getRecentLessonPlans } from "../../../services/lessonService";
import { getGradientForId } from "../../../utils/gradientColors";
import AddIcon from "@mui/icons-material/Add";

const RecentOpened = () => {
  const navigate = useNavigate();

  const [recentItems, setRecentItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const handleCardClick = (lessonId) => {
    navigate(`/app/lessons/${lessonId}`);
  };

  const handleCreateLessonClick = () => {
    navigate("/app/lessons/create");
  };

  const formatRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
  };

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
        {recentItems.map((item) => {
          // Extract lesson information
          const className = item.classId?.className || "Unknown Class";
          const title =
            item.parameters?.specificTopic ||
            item.parameters?.sow?.topic ||
            item.title ||
            "Untitled Lesson";

          // Get consistent gradient based on lesson ID
          const gradient = getGradientForId(item._id);

          return (
            <div
              key={item._id}
              className="recent-card"
              onClick={() => handleCardClick(item._id)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleCardClick(item._id);
                }
              }}
              aria-label={`Open lesson: ${title}`}
            >
              <div
                className="card-gradient-header"
                style={{ background: gradient }}
              >
                <div className="gradient-overlay"></div>
                <h3 className="card-title-overlay">{title}</h3>
              </div>
              <div className="card-content">
                <p className="card-grade">{className}</p>
                <p className="card-meta">
                  Opened {formatRelativeDate(item.updatedAt)}
                </p>
              </div>
            </div>
          );
        })}

        {/* Show add lesson card if no recent items or less than 4 items */}
        {recentItems.length < 4 && (
          <div
            className="add-lesson-card"
            onClick={handleCreateLessonClick}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleCreateLessonClick();
              }
            }}
            aria-label="Create new lesson"
          >
            <div className="add-icon-wrapper">
              <AddIcon />
            </div>
            <span>Create New Lesson</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="recent-opened-container">
      <div className="recent-header">
        <h2 className="recent-opened-title">My Lessons</h2>
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
    </div>
  );
};

export default RecentOpened;
