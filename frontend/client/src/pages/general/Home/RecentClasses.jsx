import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RecentClasses.css'; // We will create a dedicated CSS file
import { getRecentClasses } from '../../../services/classService'; // Import the new class service

const RecentClasses = () => {
  const navigate = useNavigate();
  
  const [recentClasses, setRecentClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      setIsLoading(true);
      try {
        const data = await getRecentClasses();
        setRecentClasses(data);
      } catch (error) {
        console.error("Could not fetch recent classes:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecent();
  }, []);

  const handleViewAll = () => {
    navigate("/app/classes"); // Navigate to the main classes page
  };

  const handleCardClick = (classId) => {
    // Navigate to the page that displays lessons for this class
    navigate(`/app/classes/${classId}`); 
  };

  // A mapping for subject images
  const subjectThumbnails = {
    'English': '/Class/english.png',
    'Mathematics': '/images/subjects/math.png',
    'Science': '/images/subjects/science.png',
    'History': '/images/subjects/history.png',
    'Default': '/images/subjects/default.png'
  };

  return (
    <div className="recent-classes-container">
      <div className="recent-header">
        <h2 className="recent-title">Recent Classes</h2>
        <button className="view-all-btn" onClick={handleViewAll}>
          View All
          <span className="arrow">›</span>
        </button>
      </div>
      
      {isLoading ? (
        <p>Loading recent classes...</p>
      ) : (
        <div className="recent-grid">
          {recentClasses.map((classItem) => {
            const thumbnail = subjectThumbnails[classItem.subject] || subjectThumbnails['Default'];
            
            return (
              <div
                key={classItem._id}
                className="recent-card"
                onClick={() => handleCardClick(classItem._id)}
              >
                <div className="card-header">
                  <img
                    src={thumbnail}
                    alt={classItem.subject}
                    className="subject-image"
                  />
                  <div className="subject-badge">{classItem.subject}</div>
                </div>
                <div className="card-content">
                  <h3 className="card-title">{classItem.className}</h3>
                  <p className="card-grade">{classItem.grade}</p>
                  <p className="card-meta">Year {classItem.year}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentClasses;