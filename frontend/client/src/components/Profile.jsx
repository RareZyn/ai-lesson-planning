import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { Avatar, IconButton, Menu, MenuItem, Badge, Divider } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  const notifOpen = Boolean(notifAnchorEl);
  const profileOpen = Boolean(profileAnchorEl);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser({
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          email: currentUser.email
        });
      } else {
        setUser(null);
      }
    });

    // Mock notifications data
    setNotifications([
      { id: 1, text: 'New lesson available', read: false, time: '2 hours ago' },
      { id: 2, text: 'Assignment due tomorrow', read: false, time: '1 day ago' }
    ]);

    return () => unsubscribe();
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
    try {
      await signOut(auth);
      handleProfileClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user) return null;

  return (
    <div className="profile-container">
      {/* Notifications Dropdown */}
      <IconButton 
        aria-label="notifications"
        onClick={handleNotifOpen}
        className="notification-icon"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={notifAnchorEl}
        open={notifOpen}
        onClose={handleNotifClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          style: {
            width: '320px',
            maxHeight: '400px',
            padding: 0
          }
        }}
      >
        <MenuItem className="menu-title" style={{ fontWeight: 'bold' }}>
          Notifications
        </MenuItem>
        <Divider />
        
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <MenuItem 
              key={notification.id} 
              className={`notification-item ${notification.read ? '' : 'unread'}`}
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
        <Avatar
          src={user.photoURL}
          alt={user.displayName}
          sx={{ width: 36, height: 36 }}
        />
      </div>
      
      <Menu
        anchorEl={profileAnchorEl}
        open={profileOpen}
        onClose={handleProfileClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <div className="profile-menu-header">
          <Avatar src={user.photoURL} sx={{ width: 40, height: 40 }} />
          <div className="profile-menu-user-info">
            <div className="profile-menu-name">{user.displayName}</div>
            <div className="profile-menu-email">{user.email}</div>
          </div>
        </div>
        
        <Divider />
        
        <MenuItem onClick={handleLogout} className="logout-item">
          <LogoutIcon fontSize="small" className="menu-icon" />
          <span>Sign Out</span>
        </MenuItem>
      </Menu>
    </div>
  );
};

export default Profile;