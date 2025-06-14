// src/index.jsx - Final version with proper context order
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext"; // Firebase auth context
import { UserProvider } from "./context/UserContext"; // Backend user context
import router from "./routes";
import "./index.css";

// Import Bootstrap and Ant Design CSS
import "bootstrap/dist/css/bootstrap.min.css";
import "antd/dist/reset.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <UserProvider>
        <RouterProvider router={router} />
      </UserProvider>
    </AuthProvider>
  </React.StrictMode>
);
