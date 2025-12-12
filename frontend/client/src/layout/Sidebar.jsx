import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

import HomeIcon from "@mui/icons-material/Home";
import FolderCopyIcon from "@mui/icons-material/FolderCopy";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import School from "@mui/icons-material/School";
import BarChartIcon from "@mui/icons-material/BarChart";
import AdminPanelSettings from "@mui/icons-material/AdminPanelSettings";

import { authAPI } from "../services/api";

const Sidebar = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPinned, setIsPinned] = useState(true);
  const [user, setUser] = useState(null); // ✅ state to store user
  const [loading, setLoading] = useState(true);

  // ✅ Mobile view menu state
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Close menu when clicking outside (simple handling via backdrop)
  const handleMobileMenuClose = () => setShowMobileMenu(false);

  // Scroll detection to hide/show nav
  useEffect(() => {
    if (!isMobile) return;

    const controlNavbar = () => {
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        if (mainContent.scrollTop > lastScrollY && mainContent.scrollTop > 20) {
          // Scroll Down -> Hide
          setNavVisible(false);
          setShowMobileMenu(false);
        } else {
          // Scroll Up -> Show
          setNavVisible(true);
        }
        setLastScrollY(mainContent.scrollTop);
      }
    };

    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.addEventListener('scroll', controlNavbar);
    }

    return () => {
      if (mainContent) {
        mainContent.removeEventListener('scroll', controlNavbar);
      }
    };
  }, [isMobile, lastScrollY]);

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
    { icon: <BarChartIcon />, label: "Analytics", path: "/app/analytics" },
    { icon: <PeopleAltIcon />, label: "Community", path: "/app/community" },
    ...(isAdminView
      ? [{ icon: <AdminPanelSettings />, label: "Admin", path: "/app/admin" }]
      : []),
  ];

  // Specific main items for mobile
  const mobileMainLabels = ["Home", "My Lessons", "My Classes"];
  const mainItems = menuItems.filter(item => mobileMainLabels.includes(item.label));
  const otherItems = menuItems.filter(item => !mobileMainLabels.includes(item.label));

  // Import More icon dynamically or use existing logic if I can't import new dependency easily?
  // I found Sidebar.jsx imports mui/icons. I'll stick to text "Others" or ... if I can't add import easily.
  // Wait, I can add imports.
  // But wait, the replace tool replaces a block. I need to add the import at the TOP separately if I want to use MoreHoriz.
  // Or I can just use one of the existing icons temporarily like 'AdminPanelSettings' or just text "..."
  // Actually, I can use a separate `replace_file_content` to add the import first.

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

            {/* Others Button */}
            <li onClick={() => setShowMobileMenu(!showMobileMenu)}>
              <div className={`bottom-menu-item ${showMobileMenu ? "active" : ""}`}>
                <span className="bottom-menu-icon">
                  {/* Simple 3-dots using CSS or SVG if import is hard. 
                        Let's try to use a generic icon or text for now, 
                        I'll add the import in a previous step to be safe.
                    */}
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }}></div>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }}></div>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }}></div>
                  </div>
                </span>
                <span className="bottom-menu-label">Others</span>
              </div>
            </li>
          </ul>
        </div>
      </>
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
