import React from "react";
import { useNavigate } from "react-router-dom";
import "./RecentClasses.css";

const RecentClasses = () => {
  const navigate = useNavigate();

  // Recent classes data matching your image
  const recentClasses = [
    {
      id: 1,
      class: "4 Albiruni",
      subject: "English",
      time: "9:00 AM - 10:00 AM",
    },
    {
      id: 2,
      class: "5 Ibn Sina",
      subject: "Mathematics",
      time: "10:00 AM - 11:00 AM",
    },
    {
      id: 3,
      class: "3 Al-Khwarizmi",
      subject: "Science",
      time: "11:00 AM - 12:00 PM",
    },
    {
      id: 4,
      class: "6 Tun Fatimah",
      subject: "Bahasa Melayu",
      time: "1:00 PM - 2:00 PM",
    },
    {
      id: 5,
      class: "2 Hang Tuah",
      subject: "Sejarah",
      time: "2:00 PM - 3:00 PM",
    },
  ];

  const handleViewAll = () => {
    navigate("/classes-all"); // Navigate to view all classes page
  };

  const handleClassClick = (classItem) => {
    // Navigate to specific class page
    console.log(
      "Navigating to:",
      `/class/${classItem.id}`,
      "Class:",
      classItem.class
    );
    navigate(`/class/${classItem.id}`);
  };

  return (
    <div className="recent-classes-container">
      <div className="recent-classes-header">
        <h2 className="recent-classes-title">Recent Classes</h2>
        <button className="view-all-btn" onClick={handleViewAll}>
          View All
          <span className="arrow">›</span>
        </button>
      </div>
      <div className="recent-classes-grid">
        {recentClasses.map((classItem) => (
          <div
            key={classItem.id}
            className="class-card"
            onClick={() => handleClassClick(classItem)}
          >
            <h3 className="class-name">{classItem.class}</h3>
            <div className="class-details">
              <p className="class-subject">
                <span className="label">Subject:</span> {classItem.subject}
              </p>
              <p className="class-time">
                <span className="label">Time:</span> {classItem.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentClasses;
