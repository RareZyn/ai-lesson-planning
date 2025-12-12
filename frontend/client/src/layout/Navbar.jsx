import React, { useState, useEffect } from "react";
import "./Navbar.css";
import Searchbar from "../components/general/Searchbar";
import Profile from "../components/general/Profile";
import notificationService from "../services/notificationService";
import { Badge, Dropdown, List, Avatar, Typography, Button, Empty } from "antd";
import { BellOutlined, InfoCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Text } = Typography;

const Navbar = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.data.filter((n) => !n.isRead).length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Optional: Poll for notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification._id);
        fetchNotifications(); // Refresh state
      } catch (error) {
        console.error("Error marking as read", error);
      }
    }

    if (notification.type === "lesson_approval" && notification.lessonId) {
      // Admin: Navigate to new Admin Review Page
      navigate(`/app/admin/lessons/${notification.lessonId._id || notification.lessonId}/review`);
    } else if (["lesson_approved", "lesson_rejected"].includes(notification.type) && notification.lessonId) {
      // Teacher: Navigate to My Lessons Display
      navigate(`/app/lessons/${notification.lessonId._id || notification.lessonId}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all as read", error);
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationService.deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error clearing notifications", error);
    }
  };

  const notificationMenu = (
    <div
      className="notification-dropdown-content"
      style={{
        backgroundColor: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        borderRadius: "8px",
        padding: "10px",
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-2 px-2">
        <Text strong>Notifications</Text>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button
            type="text"
            size="small"
            onClick={handleClearAll}
            icon={<DeleteOutlined />}
            danger
            title="Clear All"
          />
          <Button type="link" size="small" onClick={handleMarkAllRead}>
            Mark all read
          </Button>
        </div>
      </div>
      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        <List
          itemLayout="horizontal"
          dataSource={notifications}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No notifications" /> }}
          renderItem={(item) => (
            <List.Item
              onClick={() => handleNotificationClick(item)}
              style={{
                cursor: "pointer",
                padding: "8px 12px",
                backgroundColor: item.isRead ? "#fff" : "#f0f9ff",
                borderRadius: "4px",
                marginBottom: "4px",
                transition: "background 0.3s",
              }}
              className="notification-item"
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    src={item.sender?.avatar || null}
                    icon={!item.sender?.avatar && <InfoCircleOutlined />}
                    style={{ backgroundColor: item.isRead ? '#ccc' : '#1890ff' }}
                  />
                }
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Text strong={!item.isRead} style={{ fontSize: '13px' }}>
                      {item.sender?.name || "System"}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '10px', marginLeft: '8px', whiteSpace: 'nowrap' }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </div>
                }
                description={
                  <Text type="secondary" style={{ fontSize: '12px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {item.message}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      </div>
    </div>
  );

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Left group - logo and search */}
        <div className="navbar-left-group">
          {/* Logo */}
          <div className="navbar-logo">
            <img
              src="/logo/LessonPlanning.webp"
              alt="Company Logo"
              className="logo-img"
            />
          </div>

          <Searchbar
            placeholder="Type to search materials, lesson etc..."
            onSearch={(value) => console.log(value)}
            className="navbar-search-input"
          />
        </div>
        <div className="navbar-right-group d-flex align-items-center gap-3">

          {/* Notification Bell */}
          <Dropdown
            dropdownRender={() => notificationMenu}
            trigger={["click"]}
            placement="bottomRight"
            arrow
          >
            <Badge count={unreadCount} size="small" offset={[-2, 2]}>
              <BellOutlined
                style={{ fontSize: "20px", color: "#555", cursor: "pointer" }}
              />
            </Badge>
          </Dropdown>

          <Profile />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
