
import React, { useState, useEffect } from "react";
import "./Navbar.css";
import Searchbar from "../components/general/Searchbar";
import notificationService from "../services/notificationService";
import { Badge, Dropdown, List, Avatar, Typography, Empty } from "antd";
import { BellOutlined, InfoCircleOutlined, RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "./Breadcrumb";
import { useSocket } from "../context/SocketContext"; // Import useSocket

const { Text } = Typography;



const Navbar = () => {
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const socket = useSocket(); // Get socket instance

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      if (res.success) {
        // Filter only unread for the dropdown preview
        const unread = res.data.filter((n) => !n.isRead);
        setUnreadNotifications(unread);
        setUnreadCount(unread.length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (socket) {
      socket.on("new_notification", (notification) => {
        console.log("Real-time notification received:", notification);
        setUnreadNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      // Listen for single read event (from other devices/tabs/pages)
      socket.on("notification_read", (readNotificationId) => {
        setUnreadNotifications((prev) => {
          const filtered = prev.filter((n) => n._id !== readNotificationId);
          setUnreadCount(filtered.length);
          return filtered;
        });
      });

      // Listen for "Mark All as Read" event
      socket.on("all_notifications_read", () => {
        setUnreadNotifications([]);
        setUnreadCount(0);
      });

      return () => {
        socket.off("new_notification");
        socket.off("notification_read");
        socket.off("all_notifications_read");
      };
    }

    // Fallback polling (keep it just in case socket disconnects, but increase interval)
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [socket]);

  const handleNotificationClick = async (notification) => {
    // Optimistic Update: Remove from list immediately
    setUnreadNotifications((prev) => prev.filter((n) => n._id !== notification._id));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await notificationService.markAsRead(notification._id);
      // fetchNotifications(); // No need to re-fetch immediately if we trust optimistic update
    } catch (error) {
      console.error("Error marking as read", error);
      // Rollback if needed (optional, but good practice would be to re-fetch on error)
      fetchNotifications();
    }

    if (notification.type === "lesson_approval" && notification.lessonId) {
      navigate(`/app/admin/lessons/${notification.lessonId._id || notification.lessonId}/review`);
    } else if (["lesson_approved", "lesson_rejected"].includes(notification.type) && notification.lessonId) {
      navigate(`/app/lessons/${notification.lessonId._id || notification.lessonId}`);
    }
  };

  const notificationMenu = (
    <div
      className="notification-dropdown-content"
      style={{
        backgroundColor: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        borderRadius: "8px",
        width: "320px",
        overflow: 'hidden'
      }}
    >
      <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
        <Text strong>Unread Notifications</Text>
      </div>

      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        <List
          itemLayout="horizontal"
          dataSource={unreadNotifications.slice(0, 5)} // Show max 5 unread
          locale={{
            emptyText: <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No new notifications"
              style={{ margin: '20px 0' }}
            />
          }}
          renderItem={(item) => (
            <List.Item
              onClick={() => handleNotificationClick(item)}
              style={{
                cursor: "pointer",
                padding: "10px 15px",
                backgroundColor: "#f0f9ff",
                borderBottom: '1px solid #f0f0f0',
                transition: "background 0.2s",
              }}
              className="notification-dropdown-item"
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    src={item.sender?.avatar || null}
                    icon={!item.sender?.avatar && <InfoCircleOutlined />}
                    size="small"
                    style={{ backgroundColor: '#1890ff' }}
                  />
                }
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Text strong style={{ fontSize: '12px' }}>
                      {item.sender?.name || "System"}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '10px', marginLeft: '8px' }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </div>
                }
                description={
                  <Text type="secondary" style={{ fontSize: '11px', display: 'block', lineHeight: 1.2 }}>
                    {item.message}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      </div>

      <div
        className="text-center py-2"
        style={{
          borderTop: '1px solid #f0f0f0',
          cursor: 'pointer',
          backgroundColor: '#fafafa',
          transition: 'background 0.2s'
        }}
        onClick={() => navigate('/app/notifications')}
      >
        <Text type="secondary" style={{ fontSize: '12px' }}>
          View All Notifications <RightOutlined style={{ fontSize: '10px' }} />
        </Text>
      </div>
    </div>
  );

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Left group - logo, breadcrumb, and search */}
        <div className="navbar-left-group">
          {/* Logo */}
          <div className="navbar-logo">
            <img
              src="/logo/LessonPlanning.webp"
              alt="Company Logo"
              className="logo-img"
            />
          </div>

          {/* Breadcrumb next to logo */}
          <Breadcrumb />

          <Searchbar
            placeholder="Type to search materials, lesson etc..."
            onSearch={(value) => console.log(value)}
            className="navbar-search-input"
          />
        </div>
        <div className="navbar-right-group d-flex align-items-center gap-3">

          {/* Notification Bell (Restored) */}
          <Dropdown
            dropdownRender={() => notificationMenu}
            trigger={["click"]}
            placement="bottomRight"
            arrow={{ pointAtCenter: true }}
          >
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                <BellOutlined
                  style={{ fontSize: "20px", color: "#555" }}
                />
              </Badge>
            </div>
          </Dropdown>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
