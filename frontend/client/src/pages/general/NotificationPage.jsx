
import React, { useState, useEffect } from "react";
import { List, Typography, Button, Tabs, Card, Empty, Avatar, Tag, Popconfirm } from "antd";
import {
    CheckCircleOutlined,
    DeleteOutlined,
    InfoCircleOutlined
} from "@ant-design/icons";
import notificationService from "../../services/notificationService";
import { useNavigate } from "react-router-dom";
import "./NotificationPage.css";

const { Title, Text, Paragraph } = Typography;

const NotificationPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("all");

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await notificationService.getNotifications();
            if (res.success) {
                setNotifications(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            // Optimistic update
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error("Error marking as read", error);
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

    const handleDeleteAll = async () => {
        try {
            await notificationService.deleteAllNotifications();
            setNotifications([]);
        } catch (error) {
            console.error("Error deleting notifications", error);
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            handleMarkAsRead(notification._id);
        }

        if (notification.type === "lesson_approval" && notification.lessonId) {
            navigate(`/app/admin/lessons/${notification.lessonId._id || notification.lessonId}/review`);
        } else if (["lesson_approved", "lesson_rejected"].includes(notification.type) && notification.lessonId) {
            navigate(`/app/lessons/${notification.lessonId._id || notification.lessonId}`);
        }
    };

    const filteredNotifications = activeTab === "unread"
        ? notifications.filter(n => !n.isRead)
        : notifications;

    return (
        <div className="notification-page-container">
            <div className="notification-header">
                <Title level={2} className="notification-title">
                    Notifications
                </Title>
                <div className="notification-actions">
                    <Button
                        icon={<CheckCircleOutlined />}
                        onClick={handleMarkAllRead}
                        className="action-btn"
                    >
                        <span className="btn-text">Mark all read</span>
                    </Button>
                    <Popconfirm
                        title="Are you sure?"
                        description="This will delete all notifications permanently."
                        onConfirm={handleDeleteAll}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            icon={<DeleteOutlined />}
                            danger
                            className="action-btn"
                        >
                            <span className="btn-text">Clear all</span>
                        </Button>
                    </Popconfirm>
                </div>
            </div>

            <Card bordered={false} className="notification-card">
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={[
                        { label: `All (${notifications.length})`, key: 'all' },
                        { label: `Unread (${notifications.filter(n => !n.isRead).length})`, key: 'unread' }
                    ]}
                />

                <List
                    loading={loading}
                    itemLayout="horizontal"
                    dataSource={filteredNotifications}
                    locale={{
                        emptyText: <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={activeTab === 'unread' ? "No unread notifications" : "No notifications yet"}
                        />
                    }}
                    renderItem={(item) => (
                        <List.Item
                            className={`notification-list-item ${!item.isRead ? 'unread' : ''}`}
                            onClick={() => handleNotificationClick(item)}
                            extra={
                                !item.isRead && (
                                    <div className="notification-badge">
                                        <Tag color="blue" bordered={false}>New</Tag>
                                    </div>
                                )
                            }
                        >
                            <List.Item.Meta
                                avatar={
                                    <Avatar
                                        src={item.sender?.avatar}
                                        icon={!item.sender?.avatar && <InfoCircleOutlined />}
                                        style={{ backgroundColor: item.isRead ? '#ccc' : '#1890ff' }}
                                        size="large"
                                    />
                                }
                                title={
                                    <div className="notification-item-title">
                                        <Text strong={!item.isRead}>{item.sender?.name || "System Message"}</Text>
                                        <Text type="secondary" className="notification-time">
                                            {new Date(item.createdAt).toLocaleString()}
                                        </Text>
                                    </div>
                                }
                                description={
                                    <div className="notification-message">
                                        <Paragraph ellipsis={{ rows: 2, expandable: false }} style={{ marginBottom: 0 }}>
                                            {item.message}
                                        </Paragraph>
                                    </div>
                                }
                            />
                        </List.Item>
                    )}
                />
            </Card>
        </div>
    );
};

export default NotificationPage;
