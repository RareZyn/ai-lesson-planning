import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

import HomeIcon from "@mui/icons-material/Home";
import FolderCopyIcon from "@mui/icons-material/FolderCopy";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import School from "@mui/icons-material/School";
import AdminPanelSettings from "@mui/icons-material/AdminPanelSettings";

import { authAPI } from "../services/api";

const Sidebar = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPinned, setIsPinned] = useState(false);
  const [user, setUser] = useState(null); // ✅ state to store user
  const [loading, setLoading] = useState(true);

  // ✅ Fetch user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await authAPI.getMe();
        setUser(res.user);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setIsPinned(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const togglePin = () => {
    if (!isMobile) setIsPinned(!isPinned);
  };

  // ✅ Default role logic
  const roles = user?.roles || [user?.role || "teacher"];
  const isAdminView = roles.some((r) => r !== "teacher");

  // ✅ Prevent flicker before user loads
  if (loading) return null;

  const menuItems = [
    { icon: <HomeIcon />, label: "Home", path: "/app", end: true },
    { icon: <FolderCopyIcon />, label: "My Lessons", path: "/app/lessons" },
    { icon: <School />, label: "My Classes", path: "/app/classes" },
    { icon: <PeopleAltIcon />, label: "Community", path: "/app/community" },
    ...(isAdminView
      ? [{ icon: <AdminPanelSettings />, label: "Admin", path: "/app/admin" }]
      : []),
  ];

  // ✅ Mobile view
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

  // ✅ Desktop view
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
