// src/components/layout/Navbar.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-brand ps-3">
          <img src="./logo/lesson.png" alt="Lesson Planner" />
          <span class="text-white">Lesson Planner</span>
        </Link>
      </div>
      <div className="navbar-right">
        <div className="search-bar">
          <input type="text" placeholder="Search..." />
          <button type="button" className="search-button">
            <i className="icon icon-search"></i>
          </button>
        </div>
        <div className="notification-bell">
          <span className="notification-count">11</span>
          <i className="icon icon-bell"></i>
        </div>
        <div className="user-profile">
          <img src="/avatar.png" alt="User" className="avatar" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
