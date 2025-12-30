import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth(); // Assuming AuthContext provides 'user' object

    useEffect(() => {
        let newSocket;

        const SERVER_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
        // Adjust URL logic if needed based on prod/dev environment

        if (user) {
            // Connect only if user is logged in
            newSocket = io(SERVER_URL, {
                transports: ["websocket"], // Use websocket for better performance
                reconnection: true,
            });

            newSocket.on("connect", () => {
                console.log("Socket connected:", newSocket.id);
                // Join user-specific room
                newSocket.emit("join", user._id || user.id);
            });

            setSocket(newSocket);
        }

        return () => {
            if (newSocket) newSocket.disconnect();
        };
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
