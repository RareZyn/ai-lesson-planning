// src/components/general/Profile.jsx - Fixed with proper context integration
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import {
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Divider,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import "./Profile.css";
import { useUser } from "../../context/UserContext"; // Use your context
import { useAuth } from "../../context/AuthContext"; // Use your context

const Profile = () => {
  const navigate = useNavigate();

  // Use your context providers instead of direct Firebase auth
  const { user: contextUser, logout: contextLogout } = useUser();
  const { currentUser: firebaseUser } = useAuth();

  // Use whichever user data is available
  const user = contextUser || firebaseUser;

  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const notifOpen = Boolean(notifAnchorEl);
  const profileOpen = Boolean(profileAnchorEl);

  useEffect(() => {
    // Mock notifications data
    setNotifications([
      { id: 1, text: "New lesson available", read: false, time: "2 hours ago" },
      {
        id: 2,
        text: "Assignment due tomorrow",
        read: false,
        time: "1 day ago",
      },
    ]);
  }, []);

  const handleNotifOpen = (event) => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  const handleProfileOpen = (event) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple logout attempts

    try {
      setIsLoggingOut(true);
      handleProfileClose(); // Close the menu immediately

      // Call both Firebase and context logout
      await Promise.all([
        signOut(auth), // Firebase logout
        contextLogout(), // Context logout (which also calls backend)
      ]);

      // Clear any remaining local storage
      localStorage.removeItem("authToken");

      // Navigate to login page immediately
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, try to navigate to login
      navigate("/", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Don't render if no user or if logging out
  if (!user || isLoggingOut) return null;

  // Get user display data with fallbacks
  const displayName = user.name || user.displayName || user.email || "User";
  const photoURL = user.avatar || user.photoURL;
  const email = user.email;

  return (
    <div className="profile-container">
      {/* Notifications Dropdown */}
      <IconButton
        aria-label="notifications"
        onClick={handleNotifOpen}
        className="notification-icon"
        disabled={isLoggingOut}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={notifAnchorEl}
        open={notifOpen}
        onClose={handleNotifClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          style: {
            width: "320px",
            maxHeight: "400px",
            padding: 0,
          },
        }}
      >
        <MenuItem className="menu-title" style={{ fontWeight: "bold" }}>
          Notifications
        </MenuItem>
        <Divider />

        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              className={`notification-item ${
                notification.read ? "" : "unread"
              }`}
            >
              <div className="notification-content">
                <div className="notification-text">{notification.text}</div>
                <div className="notification-time">{notification.time}</div>
              </div>
            </MenuItem>
          ))
        ) : (
          <MenuItem className="empty-notifications">
            No new notifications
          </MenuItem>
        )}
      </Menu>

      {/* Profile Dropdown */}
      <div className="profile-avatar" onClick={handleProfileOpen}>
        <Avatar src={photoURL} alt={displayName} sx={{ width: 36, height: 36 }}>
          {/* Fallback to first letter if no photo */}
          {!photoURL && displayName.charAt(0).toUpperCase()}
        </Avatar>
      </div>

      <Menu
        anchorEl={profileAnchorEl}
        open={profileOpen}
        onClose={handleProfileClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <div className="profile-menu-header">
          <Avatar src={photoURL} sx={{ width: 40, height: 40 }}>
            {!photoURL && displayName.charAt(0).toUpperCase()}
          </Avatar>
          <div className="profile-menu-user-info">
            <div className="profile-menu-name">{displayName}</div>
            <div className="profile-menu-email">{email}</div>
          </div>
        </div>

        <Divider />

        <MenuItem
          onClick={handleLogout}
          className="logout-item"
          disabled={isLoggingOut}
        >
          <LogoutIcon fontSize="small" className="menu-icon" />
          <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
        </MenuItem>
      </Menu>
    </div>
  );
};

export default Profile;
