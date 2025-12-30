import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./RecentClasses.css";
import { getRecentClasses } from "../../../services/classService";
import ClassCard from "../../class/ClassCard";
import { FaPlus } from "react-icons/fa";
import CreateClassModal from "../../class/CreateClassModal";
import LoadingSpinner from "../../../components/common/LoadingSpinner";

const CreateClassCard = ({ onClick }) => {
  return (
    <div className="add-class-card" onClick={onClick}>
      <div className="add-icon-wrapper">
        <FaPlus />
      </div>
      <h3 className="add-card-title">Create Class</h3>
      <p className="add-card-text">New Class</p>
    </div>
  );
};

const RecentClasses = () => {
  const navigate = useNavigate();

  const [recentClasses, setRecentClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  useEffect(() => {
    fetchRecent();
  }, []);

  const handleViewAll = () => {
    navigate("/app/classes");
  };

  const handleCreateClassClick = () => {
    setIsModalOpen(true);
  };

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    fetchRecent(); // Refresh list after creation
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner tip="Loading recent classes..." />;
    }

    if (recentClasses.length === 0) {
      // Even if empty, show the create card
      return (
        <div className="recent-classes-grid">
          <div className="horizontal-scroll-item">
            <CreateClassCard onClick={handleCreateClassClick} />
          </div>
          <p style={{ gridColumn: "1 / -1", marginTop: "1rem" }}>No recent classes found.</p>
        </div>
      );
    }

    return (
      <div className="recent-classes-grid">
        <div className="horizontal-scroll-item">
          <CreateClassCard onClick={handleCreateClassClick} />
        </div>
        {recentClasses.map((classItem) => (
          <div key={classItem._id} className="horizontal-scroll-item">
            <ClassCard classInfo={classItem} />
          </div>
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

      <CreateClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSuccess}
      />
    </div>
  );
};

export default RecentClasses;