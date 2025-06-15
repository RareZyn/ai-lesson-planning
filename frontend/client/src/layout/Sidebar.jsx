import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

// Import your SVG icons
import HomeIcon from "@mui/icons-material/Home";
import FolderCopyIcon from "@mui/icons-material/FolderCopy";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import School from "@mui/icons-material/School";

const Sidebar = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsPinned(false); // Automatically unpin on mobile
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const togglePin = () => {
    if (!isMobile) {
      setIsPinned(!isPinned);
    }
  };

  const menuItems = [
    { icon: <HomeIcon />, label: "Home", path: "/app", end: true },
    { icon: <FolderCopyIcon />, label: "My Lessons", path: "/app/lessons" },
    { icon: <School />, label: "My Classes", path: "/app/classes" },
    { icon: <PeopleAltIcon />, label: "Community", path: "/app/community" },
  ];

  // Mobile view remains unchanged
  if (isMobile) {
    return (
      <div className="bottom-navigation">
        <ul className="bottom-menu">
          {menuItems.map((item) => (
            <li key={item.label}>
              <NavLink
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `bottom-menu-item ${isActive ? "active" : ""}`
                }
              >
                <span className="bottom-menu-icon">{item.icon}</span>
                <span className="bottom-menu-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Desktop view uses the `.pinned` class to control expansion
  return (
    <div className={`sidebar ${isPinned ? "pinned" : ""}`}>
      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li key={item.label}>
            <NavLink
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `menu-item ${isActive ? "active" : ""}`
              }
              title={!isPinned ? item.label : ""}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="sidebar-footer">
        {/* THE ONLY CHANGE IS THE CLASSNAME ON THE BUTTON */}
        <button
          className="pin-btn"
          onClick={togglePin}
          title={isPinned ? "Unpin sidebar" : "Pin sidebar open"}
          aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar open"}
        >
          {isPinned ? <ChevronLeft /> : <ChevronRight />}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;