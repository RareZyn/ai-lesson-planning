import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./RecentClasses.css";
import { getRecentClasses } from "../../../services/classService";
import { School, Subject, CalendarToday } from "@mui/icons-material";

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

  // Map subject to appropriate background images
  const getSubjectImage = (subject) => {
    const subjectImages = {
      English: "/Class/english.jpg",
      Mathematics: "/Class/mathematics.jpg",
      Science: "/Class/science.jpg",
      History: "/Class/history.jpg",
      Geography: "/Class/geography.jpg",
      Physics: "/Class/physics.jpg",
      Chemistry: "/Class/chemistry.jpg",
      Biology: "/Class/biology.jpg",
      // Default fallback
      default: "/Class/english.jpg",
    };

    return subjectImages[subject] || subjectImages["default"];
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="recent-classes-grid">
          <div className="class-card-skeleton"></div>
          <div className="class-card-skeleton"></div>
        </div>
      );
    }

    return (
      <div className="recent-classes-grid">
        {recentClasses.map((classItem) => {
          const backgroundImage = getSubjectImage(classItem.subject);

          return (
            <div
              key={classItem._id}
              className="class-card"
              onClick={() => handleCardClick(classItem._id)}
            >
              <div
                className="card-image-header"
                style={{ backgroundImage: `url(${backgroundImage})` }}
              >
                <div className="image-overlay"></div>
                <div className="subject-badge">{classItem.subject}</div>
              </div>
              <div className="card-body">
                <h3 className="class-name">
                  {classItem.grade} {classItem.className}
                </h3>
                <p className="class-year">Year: {classItem.year}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="recent-classes-container">
      <div className="recent-header">
        <h2 className="recent-title">Recent Classes</h2>
        <button
          className="btn btn-link p-0 view-all-btn"
          onClick={handleViewAll}
        >
          View All
          <span className="arrow ms-1">›</span>
        </button>
      </div>

      {renderContent()}
    </div>
  );
};

export default RecentClasses;
