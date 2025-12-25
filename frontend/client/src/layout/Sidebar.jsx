
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Badge, Dropdown, List, Avatar, Typography, Button, Empty, message } from "antd";
import {
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  HomeOutlined,
  BookOutlined,
  SolutionOutlined,
  BarChartOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  LeftOutlined,
  RightOutlined
} from "@ant-design/icons";

import { authAPI } from "../services/api";
import { useUser } from "../context/UserContext";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import Profile from "../components/general/Profile"; // For mobile view dropdown
import "./Sidebar.css";

const { Text } = Typography;

const Sidebar = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPinned, setIsPinned] = useState(true);
  const [loading, setLoading] = useState(true);

  // User Context
  const { currentUser: contextUser, logout: contextLogout } = useUser();
  const { currentUser: firebaseUser } = useAuth();
  const user = contextUser || firebaseUser; // Use centralized user logic

  // Mobile Menu State
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // --- Logout Logic ---
  const handleLogout = async () => {
    try {
      await Promise.all([signOut(auth), contextLogout()]);
      localStorage.removeItem("authToken");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/", { replace: true });
    }
  };

  // --- Layout Logic ---
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setIsPinned(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Scroll detection for mobile
  useEffect(() => {
    if (!isMobile) return;
    const controlNavbar = () => {
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        if (mainContent.scrollTop > lastScrollY && mainContent.scrollTop > 20) {
          setNavVisible(false);
          setShowMobileMenu(false);
        } else {
          setNavVisible(true);
        }
        setLastScrollY(mainContent.scrollTop);
      }
    };
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.addEventListener('scroll', controlNavbar);
    return () => mainContent && mainContent.removeEventListener('scroll', controlNavbar);
  }, [isMobile, lastScrollY]);

  const togglePin = () => {
    if (!isMobile) setIsPinned(!isPinned);
  };

  const handleMobileMenuClose = () => setShowMobileMenu(false);

  // Roles
  const roles = user?.roles || [user?.role || "teacher"];
  const isAdminView = roles.some((r) => r !== "teacher");

  const menuItems = [
    { icon: <HomeOutlined />, label: "Home", path: "/app", end: true },
    { icon: <BookOutlined />, label: "My Lessons", path: "/app/lessons" },
    { icon: <SolutionOutlined />, label: "My Classes", path: "/app/classes" },
    { icon: <BarChartOutlined />, label: "Analytics", path: "/app/analytics" },
    { icon: <TeamOutlined />, label: "Community", path: "/app/community" },
    ...(isAdminView
      ? [{ icon: <SafetyCertificateOutlined />, label: "Admin", path: "/app/admin" }]
      : []),
  ];

  // Mobile logic: 
  // Main items: Home, Lessons, Classes
  // New: Notifications? Profile (at right most)
  const mobileMainLabels = ["Home", "My Lessons", "My Classes"];
  const mainItems = menuItems.filter(item => mobileMainLabels.includes(item.label));
  const otherItems = menuItems.filter(item => !mobileMainLabels.includes(item.label));

  if (isMobile) {
    return (
      <>
        {/* Others Menu Popup */}
        {showMobileMenu && (
          <>
            <div className="mobile-menu-backdrop" onClick={handleMobileMenuClose}></div>
            <div className="mobile-others-menu">
              {otherItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.path}
                  className={({ isActive }) => `mobile-other-item ${isActive ? "active" : ""}`}
                  onClick={handleMobileMenuClose}
                >
                  <span className="mobile-other-icon">{item.icon}</span>
                  <span className="mobile-other-label">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </>
        )}

        <div className={`bottom-navigation glass-effect ${navVisible ? 'nav-visible' : 'nav-hidden'}`}>
          <ul className="bottom-menu">
            {/* 1. Main Items */}
            {mainItems.map((item) => (
              <li key={item.label}>
                <NavLink
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `bottom-menu-item ${isActive ? "active" : ""}`
                  }
                  onClick={handleMobileMenuClose}
                >
                  <span className="bottom-menu-icon">{item.icon}</span>
                  <span className="bottom-menu-label">{item.label}</span>
                </NavLink>
              </li>
            ))}

            {/* 2. Others Button */}
            <li onClick={() => setShowMobileMenu(!showMobileMenu)}>
              <div className={`bottom-menu-item ${showMobileMenu ? "active" : ""}`}>
                <span className="bottom-menu-icon" style={{ display: 'flex', gap: '2px', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }}></div>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }}></div>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }}></div>
                </span>
                <span className="bottom-menu-label">Others</span>
              </div>
            </li>

            {/* 3. Profile Dropdown (Right-most) */}
            <li>
              <div className="bottom-menu-item">
                <span className="bottom-menu-icon" style={{ overflow: 'visible' }}>
                  <Profile avatarSize={24} />
                </span>
                <span className="bottom-menu-label">Profile</span>
              </div>
            </li>
          </ul>
        </div>
      </>
    );
  }

  // DESKTOP VIEW
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

      {/* spacer to push bottom actions down is handled by flex-grow of sidebar-menu */}

      <div className="sidebar-bottom-actions">
        {/* Profile Link */}
        <NavLink
          to="/app/profile"
          className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
          title="Profile"
        >
          <span className="menu-icon"><UserOutlined /></span>
          <span className="menu-label">Profile</span>
        </NavLink>

        {/* Logout */}
        <div
          className="menu-item logout-item"
          onClick={handleLogout}
          title="Logout"
          style={{ color: '#ff4d4f', marginTop: '4px' }}
        >
          <span className="menu-icon"><LogoutOutlined /></span>
          <span className="menu-label">Logout</span>
        </div>
      </div>

      <div className="sidebar-footer">
        <button
          className="pin-btn"
          onClick={togglePin}
          title={isPinned ? "Unpin sidebar" : "Pin sidebar open"}
        >
          {isPinned ? <LeftOutlined /> : <RightOutlined />}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
