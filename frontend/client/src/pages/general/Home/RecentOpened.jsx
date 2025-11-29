import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./RecentOpened.css"; // Keep container/header styles
import { getRecentLessonPlans } from "../../../services/lessonService";
import LessonCard from "../../planner/displaylesson/LessonCard";
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
        // NOTE: Keeping the cache-buster in lessonService for this route for reliability
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
  }, []); // Run only on mount

  const handleViewAll = () => {
    navigate("/app/lessons");
  };

  const handleCardClick = (lessonId) => {
    navigate(`/app/lessons/${lessonId}`);
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
      // Revert to simple skeleton divs, assuming styles for these exist in RecentOpened.css
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

    if (recentItems.length === 0) {
        return <p className="text-secondary text-center">You haven't opened any lesson plans recently.</p>;
    }

    return (
      <div className="recent-opened-grid">
        {recentItems.map((item) => (
          // Use the unified LessonCard component
          // Pass isRecent=true to trigger the "Last opened" meta display
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
    </div>
  );
};

export default RecentOpened;