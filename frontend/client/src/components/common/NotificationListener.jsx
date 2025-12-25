import React, { useEffect } from "react";
import { notification } from "antd";
import { useSocket } from "../../context/SocketContext";
import { BellOutlined } from "@ant-design/icons";

const NotificationListener = () => {
    const socket = useSocket();

    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (data) => {
            // Use Ant Design notification for better visibility than 'message'
            notification.open({
                message: 'New Notification',
                description: data.message || "You have a new update.",
                icon: <BellOutlined style={{ color: '#108ee9' }} />,
                placement: 'topRight',
                duration: 4.5, // seconds
            });
        };

        socket.on("new_notification", handleNewNotification);

        return () => {
            socket.off("new_notification", handleNewNotification);
        };
    }, [socket]);

    return null; // This component doesn't render anything visible directly
};

export default NotificationListener;
