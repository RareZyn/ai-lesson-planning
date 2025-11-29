// src/components/general/Profile.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import {
  Avatar,
  Badge,
  Button,
  Divider,
  Dropdown,
  Form,
  Input,
  Modal,
  message,
  theme,
} from "antd";
import {
  BellOutlined,
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import "./Profile.css";
import { useUser } from "../../context/UserContext";
import { useAuth } from "../../context/AuthContext";

const Profile = () => {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  // Use your context providers instead of direct Firebase auth
  const { user: contextUser, logout: contextLogout } = useUser();
  const { currentUser: firebaseUser } = useAuth();

  // Use whichever user data is available
  const user = contextUser || firebaseUser;

  const [notifications, setNotifications] = useState([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [form] = Form.useForm();

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

  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  const handleProfileOpen = (event) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };

  const handleSettingsOpen = async () => {
    // Fetch current API key from backend
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/auth/gemini-key", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      // Pre-fill the form with current user data
      form.setFieldsValue({
        name: user.name || "",
        email: user.email || "",
        schoolName: user.schoolName || "",
        geminiApiKey: data.success ? data.apiKey : "",
      });
    } catch (error) {
      console.error("Failed to fetch API key:", error);
      // Pre-fill the form without API key if fetch fails
      form.setFieldsValue({
        name: user.name || "",
        email: user.email || "",
        schoolName: user.schoolName || "",
        geminiApiKey: "",
      });
    }

    setIsSettingsModalOpen(true);
  };

  const handleSettingsClose = () => {
    setIsSettingsModalOpen(false);
    form.resetFields();
  };

  const handleSettingsSubmit = async (values) => {
    try {
      setIsUpdatingProfile(true);

      const updateData = {
        name: values.name,
        schoolName: values.schoolName,
      };

      // Only include geminiApiKey if it's not empty
      if (values.geminiApiKey && values.geminiApiKey.trim()) {
        updateData.geminiApiKey = values.geminiApiKey.trim();
      }

      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update profile");
      }

      message.success("Profile updated successfully!");
      handleSettingsClose();

      // Refresh user data - trigger a context refresh if available
      if (contextUser && typeof contextUser.refresh === "function") {
        await contextUser.refresh();
      } else {
        // Fallback: reload the page to get updated user data
        window.location.reload();
      }
    } catch (error) {
      console.error("Update profile error:", error);
      message.error(error.message || "Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple logout attempts

    try {
      setIsLoggingOut(true);

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

  // Don't render if no user or if logging out
  if (!user || isLoggingOut) return null;

  // Get user display data with fallbacks
  const displayName = user.name || user.displayName || user.email || "User";
  const photoURL = user.avatar || user.photoURL;
  const email = user.email;

  // Notification Menu Items
  const notificationItems = [
    {
      key: "header",
      label: <span style={{ fontWeight: "bold" }}>Notifications</span>,
      disabled: true,
    },
    { type: "divider" },
    ...(notifications.length > 0
      ? notifications.map((notification) => ({
        key: notification.id,
        label: (
          <div className={`notification-item ${notification.read ? "" : "unread"}`}>
            <div className="notification-content">
              <div className="notification-text">{notification.text}</div>
              <div className="notification-time">{notification.time}</div>
            </div>
          </div>
        ),
      }))
      : [
        {
          key: "empty",
          label: <span className="empty-notifications">No new notifications</span>,
          disabled: true,
        },
      ]),
  ];

  // Profile Menu Items
  const profileItems = [
    {
      key: "info",
      label: (
        <div className="profile-menu-header">
          <Avatar src={photoURL} size={40} icon={<UserOutlined />}>
            {!photoURL && displayName.charAt(0).toUpperCase()}
          </Avatar>
          <div className="profile-menu-user-info">
            <div className="profile-menu-name">{displayName}</div>
            <div className="profile-menu-email">{email}</div>
          </div>
        </div>
      ),
    },
    { type: "divider" },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
      onClick: handleSettingsOpen,
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: isLoggingOut ? "Signing out..." : "Sign Out",
      onClick: handleLogout,
      disabled: isLoggingOut,
      danger: true,
    },
  ];

  return (
    <div className="profile-container" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      {/* Notifications Dropdown */}
      <Dropdown
        menu={{ items: notificationItems }}
        trigger={["click"]}
        placement="bottomRight"
        overlayStyle={{ width: 320 }}
      >
        <Badge count={unreadCount} size="small">
          <Button
            type="text"
            icon={<BellOutlined style={{ fontSize: '20px' }} />}
            className="notification-icon"
            disabled={isLoggingOut}
          />
        </Badge>
      </Dropdown>

      {/* Profile Dropdown */}
      <Dropdown
        menu={{ items: profileItems }}
        trigger={["click"]}
        placement="bottomRight"
      >
        <div className="profile-avatar" style={{ cursor: 'pointer' }}>
          <Avatar src={photoURL} size={36} icon={<UserOutlined />}>
            {!photoURL && displayName.charAt(0).toUpperCase()}
          </Avatar>
        </div>
      </Dropdown>

      {/* Settings Modal */}
      <Modal
        title="Profile Settings"
        open={isSettingsModalOpen}
        onCancel={handleSettingsClose}
        footer={null}
        width={600}
        className="settings-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSettingsSubmit}
          autoComplete="off"
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: "Please enter your name" },
              { min: 2, max: 50, message: "Name must be between 2 and 50 characters" },
            ]}
          >
            <Input placeholder="Enter your name" size="large" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: "Email is required" }]}
          >
            <Input placeholder="Your email" size="large" disabled />
          </Form.Item>

          <Form.Item
            label="School Name"
            name="schoolName"
            rules={[
              { required: true, message: "Please enter your school name" },
              { min: 2, max: 100, message: "School name must be between 2 and 100 characters" },
            ]}
          >
            <Input placeholder="Enter your school name" size="large" />
          </Form.Item>

          <Form.Item
            label="Gemini API Key"
            name="geminiApiKey"
            help="Your current API key is displayed. Click the eye icon to show/hide. Leave as-is to keep unchanged, or enter a new key to update it."
          >
            <Input.Password
              placeholder="Enter Gemini API key"
              size="large"
              autoComplete="new-password"
              iconRender={(visible) => (visible ? "🙈" : "👁️")}
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="d-flex justify-content-end gap-2">
              <Button onClick={handleSettingsClose} disabled={isUpdatingProfile}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isUpdatingProfile}
              >
                Save Changes
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
