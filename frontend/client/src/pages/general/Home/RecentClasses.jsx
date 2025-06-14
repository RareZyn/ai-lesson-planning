import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RecentClasses.css'; // This CSS file will be updated
import { getRecentClasses } from '../../../services/classService';

// Icons can make the cards more visually appealing
import { School, Subject, CalendarToday } from '@mui/icons-material';
import Loader from '../../../components/Loader';

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
    navigate("/app/classes");
  };

  const handleCardClick = (classId) => {
    navigate(`/app/classes/${classId}`);
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
          {recentClasses.map((classItem) => (
            // --- The JSX for the card is now simpler, without the image header ---
            <div
              key={classItem._id}
              className="class-card" // We will style this class
              onClick={() => handleCardClick(classItem._id)}
            >
              <div className="card-header">
                <div className="icon-wrapper">
                    <School />
                </div>
                <h3 className="class-name">{classItem.className}</h3>
              </div>
              <div className="card-body">
                <p className="class-detail-item">
                    <Subject fontSize="small" />
                    <span>{classItem.subject}</span>
                </p>
                <p className="class-detail-item">
                    <CalendarToday fontSize="small" />
                    <span>Year: {classItem.year}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentClasses;