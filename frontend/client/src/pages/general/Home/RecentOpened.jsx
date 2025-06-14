import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RecentOpened.css';
import { getRecentLessonPlans } from '../../../services/lessonService';
import AddIcon from '@mui/icons-material/Add'; // Import an icon for the button

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
    navigate('/app/lessons');
  };

  const formatRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  // A mapping for subject images
  const subjectThumbnails = {
    'English': '/Class/english.jpg',
    'Mathematics': '/images/subjects/math.png',
    'Science': '/images/subjects/science.png',
    'History': '/images/subjects/history.png',
    'Default': '/images/subjects/default.png'
  };


  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="recent-opened-grid">
          {/* Show skeleton loaders that match the card size */}
          <div className="recent-card-skeleton"></div>
          <div className="recent-card-skeleton"></div>
        </div>
      );
    }

    if (error) {
      return <p className="status-message error">{error}</p>;
    }

    // --- RENDER THE GRID WITH THE ADD CARD IF EMPTY ---
    return (
      <div className="recent-opened-grid">
        {/* Render the actual lesson cards */}
        {recentItems.map((item) => {
          const subject = item.classId?.subject || 'General';
          const className = item.classId?.className || 'N/A';
          const title = item.parameters.specificTopic || item.parameters.sow.topic || '-';
          const thumbnail = subjectThumbnails[subject] || subjectThumbnails['Default'];

          return (
            <div key={item._id} className="recent-card" onClick={() => handleCardClick(item._id)}>
              <div className="card-header">
                <img src={thumbnail} alt={subject} className="subject-image" />
                <div className="subject-badge">{subject}</div>
              </div>
              <div className="card-content">
                <h3 className="card-title">{title}</h3>
                <p className="card-grade">{className}</p>
                <p className="card-meta">Opened {formatRelativeDate(item.updatedAt)}</p>
              </div>
            </div>
          );
        })}

        {/* --- THIS IS THE NEW "ADD" CARD LOGIC --- */}
        {/* If there are no recent items, show this special card */}
        {recentItems.length === 0 && (
          <div className="add-lesson-card" onClick={handleCreateLessonClick}>
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
          <button className="view-all-btn" onClick={handleViewAll}>
            View All
            <span className="arrow">›</span>
          </button>
        )}
      </div>

      {renderContent()}
    </div>
  );
};

export default RecentOpened;