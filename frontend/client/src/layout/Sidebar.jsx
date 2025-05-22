import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

// Import your SVG icons
import HomeIcon from "@mui/icons-material/Home";
import FolderCopyIcon from "@mui/icons-material/FolderCopy";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ChevronLeft from "@mui/icons-material/ChevronLeft";

const Sidebar = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPinned, setIsPinned] = useState(false);

  // Handle window resize
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      // Auto-collapse sidebar when switching to mobile view
      if (window.innerWidth <= 768) {
        setIsPinned(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const togglePin = () => {
    setIsPinned(!isPinned);
  };

  const menuItems = [
    { icon: <HomeIcon />, label: "Home", path: "home" },
    { icon: <FolderCopyIcon />, label: "My Lessons", path: "lessons" },
    { icon: <LibraryBooksIcon />, label: "Materials", path: "materials" },
    { icon: <PeopleAltIcon />, label: "Classes", path: "classes" },
  ];

  return (
    <>
      {isMobile ? (
        <div className="bottom-navigation">
          <ul className="bottom-menu">
            {menuItems.map((item) => (
              <li key={item.label}>
                <NavLink
                  to={item.path}
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
      ) : (
        <div className={`sidebar ${isPinned ? "pinned" : ""}`}>
          <ul className="sidebar-menu">
            {menuItems.map((item) => (
              <li key={item.label}>
                <NavLink
                  to={item.path}
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
            <button
              className={`pin-btn ${isPinned ? "pinned" : ""}`}
              onClick={togglePin}
              title={isPinned ? "Unpin sidebar" : "Pin sidebar open"}
              aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar open"}
            >
              {isPinned ? <ChevronLeft /> : <ChevronRight />}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
