import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RecentOpened.css'; // Using your original standard CSS file
import { getRecentLessonPlans } from '../../../services/lessonService'; // Import the new service

const RecentOpened = () => {
  const navigate = useNavigate();
  
  // State to hold the data fetched from the backend
  const [recentItems, setRecentItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // useEffect hook to fetch data when the component mounts
  useEffect(() => {
    const fetchRecent = async () => {
      setIsLoading(true);
      try {
        const data = await getRecentLessonPlans();
        setRecentItems(data);
      } catch (error) {
        console.error("Could not fetch recent lessons:", error);
        // You could also set an error state here to display a message
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecent();
  }, []); // The empty dependency array means this runs once on mount

  const handleViewAll = () => {
    navigate("/app/lessons");
  };

  const handleCardClick = (lessonId) => {
    navigate(`/app/lessons/${lessonId}`);
  };

  // Helper to format the relative time
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

  return (
    <div className="recent-opened-container">
      <div className="recent-header">
        <h2 className="recent-opened-title">Recently Opened</h2>
        <button className="view-all-btn" onClick={handleViewAll}>
          View All
          <span className="arrow">›</span>
        </button>
      </div>
      
      {isLoading ? (
        <p>Loading recent plans...</p>
      ) : (
        <div className="recent-opened-grid">
          {recentItems.map((item) => {
            // Extract data for clarity
            const subject = item.classId?.subject || 'General';
            const className = item.classId?.className || 'N/A';
            const title = item.parameters.specificTopic || item.parameters.sow.topic || '-';
            const thumbnail = subjectThumbnails[subject] || subjectThumbnails['Default'];

            return (
              <div
                key={item._id}
                className="recent-card"
                onClick={() => handleCardClick(item._id)}
              >
                <div className="card-header">
                  <img
                    src={thumbnail}
                    alt={subject}
                    className="subject-image"
                  />
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
        </div>
      )}
    </div>
  );
};

export default RecentOpened;