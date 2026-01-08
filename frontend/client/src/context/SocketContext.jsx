import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { useUser } from "./UserContext";

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { currentUser: user } = useUser(); // Use UserContext instead of AuthContext

    useEffect(() => {
        let newSocket;

        let SERVER_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

        // Fix: Strip '/api' from the URL if present, as socket.io needs the root URL
        if (SERVER_URL.endsWith('/api')) {
            SERVER_URL = SERVER_URL.slice(0, -4);
        }

        if (user) {
            // Connect only if user is logged in
            newSocket = io(SERVER_URL, {
                // Use polling as fallback for serverless platforms (like Vercel)
                transports: ["polling", "websocket"],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            newSocket.on("connect", () => {
                // Join user-specific room
                newSocket.emit("join", user._id || user.id);
            });

            newSocket.on("connect_error", (error) => {
                // Disable socket if connection keeps failing
                if (newSocket.io.opts.reconnectionAttempts === 0) {
                    console.warn("Socket disabled - notifications will use polling");
                }
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
