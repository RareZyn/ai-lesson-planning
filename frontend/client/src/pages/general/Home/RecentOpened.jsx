import React from "react";
import { useNavigate } from "react-router-dom";
import "./RecentOpened.css";

const RecentOpened = () => {
  const navigate = useNavigate();

  // Educational subjects data matching the image
  const recentItems = [
    {
      id: 1,
      title: "Algebraic Expression",
      subject: "MATH",
      grade: "5 Ibn Sina",
      createdBy: "Opened 2 hours ago",
      image: "/Class/math.jpeg",
    },
    {
      id: 2,
      title: "English",
      subject: "ENGLISH",
      grade: "4 Al-Kindi",
      createdBy: "Created 5 hours ago",
      image: "/Class/english.jpg",
    },
    {
      id: 3,
      title: "Science",
      subject: "SCIENCE",
      grade: "3 Al-Khwarizmi",
      createdBy: "Created 1 day ago",
      image: "/Class/science.jpg",
    },
    {
      id: 4,
      title: "Bahasa Melayu",
      subject: "BAHASA MELAYU",
      grade: "6 Kreatif",
      createdBy: "Created 2 days ago",
      image: "/Class/melayu.jpg",
    },
    {
      id: 5,
      title: "History",
      subject: "HISTORY",
      grade: "5 Al-Khwarizmi",
      createdBy: "Created 3 days ago",
      image: "/Class/history.png",
    },
  ];

  const handleViewAll = () => {
    navigate("/recent-all"); // Navigate to view all page
  };

  const handleCardClick = (item) => {
    // Navigate to specific lesson/subject page
    console.log("Navigating to:", `/lesson/${item.id}`, "Item:", item.title);
    navigate(`/lesson/${item.id}`);
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
      <div className="recent-opened-grid">
        {recentItems.map((item) => (
          <div
            key={item.id}
            className="recent-card"
            onClick={() => handleCardClick(item)}
          >
            <div className="card-header">
              <img
                src={item.image}
                alt={item.subject}
                className="subject-image"
              />
              <div className="subject-badge">{item.subject}</div>
            </div>
            <div className="card-content">
              <h3 className="card-title">{item.title}</h3>
              <p className="card-grade">{item.grade}</p>
              <p className="card-meta">{item.createdBy}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentOpened;
