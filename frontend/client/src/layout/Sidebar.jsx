// src/components/layout/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  const menuItems = [
    { icon: "user", label: "Account", path: "/account" },
    { icon: "class", label: "Class", path: "/class" },
    { icon: "lesson", label: "Lesson Planner", path: "/lessons" },
    { icon: "download", label: "File Download", path: "/downloads" },
    { icon: "activity", label: "Activity", path: "/activity" },
    { icon: "check", label: "Answer Checker", path: "/checker" },
    { icon: "dashboard", label: "Student Dashboard", path: "/dashboard" },
  ];

  return (
    <aside className="sidebar">
      <ul className="sidebar-menu">
        {menuItems.map((item, index) => (
          <li key={index} className="sidebar-item">
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
            >
              <i className={`icon icon-${item.icon}`}></i>
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;
