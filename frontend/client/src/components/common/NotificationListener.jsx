import React, { useEffect } from "react";
import { notification } from "antd";
import { useSocket } from "../../context/SocketContext";
import { BellOutlined } from "@ant-design/icons";

const NotificationListener = () => {
    const socket = useSocket();
    const [api, contextHolder] = notification.useNotification();

    useEffect(() => {
        if (!socket) return;

        console.log("🔔 NotificationListener: Socket connected, listening for events...");

        const handleNewNotification = (data) => {
            console.log("🔔 Notification Received:", data);

            // Use Ant Design notification for better visibility than 'message'
            api.open({
                message: 'New Notification',
                description: data.message || "You have a new update.",
                icon: <BellOutlined style={{ color: '#108ee9' }} />,
                placement: 'topRight',
                duration: 4.5, // seconds
                onClick: () => {
                    console.log("Notification clicked");
                },
            });

            // Optional: Play a sound
            // const audio = new Audio('/notification-sound.mp3');
            // audio.play().catch(e => console.log('Audio play failed', e));
        };

        socket.on("new_notification", handleNewNotification);

        return () => {
            socket.off("new_notification", handleNewNotification);
        };
    }, [socket, api]);

    return <>{contextHolder}</>; // Render the context holder
};

export default NotificationListener;
