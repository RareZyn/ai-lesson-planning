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

        console.log("SocketContext: Initializing...", { user: user ? user._id : 'null', SERVER_URL });

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
