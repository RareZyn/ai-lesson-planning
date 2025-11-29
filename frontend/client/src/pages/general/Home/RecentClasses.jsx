import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./RecentClasses.css"; // Keep this for container/header styles
import { getRecentClasses } from "../../../services/classService";
import ClassCard from "../../class/ClassCard";

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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="recent-classes-grid">
          <div className="class-card-skeleton"></div>
          <div className="class-card-skeleton"></div>
        </div>
      );
    }
    
    if (recentClasses.length === 0) {
        return <p>No recent classes found.</p>
    }

    return (
      <div className="recent-classes-grid">
        {recentClasses.map((classItem) => (
          <ClassCard key={classItem._id} classInfo={classItem} />
        ))}
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