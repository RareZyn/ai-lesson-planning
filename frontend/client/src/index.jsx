// src/index.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext"; // Import AuthProvider
import router from "./routes";
import "./index.css";

// Import Bootstrap and Ant Design CSS
import "bootstrap/dist/css/bootstrap.min.css";
import "antd/dist/reset.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);