// src/index.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { UserProvider } from "./context/UserContext";
import router from "./routes";
import "./index.css";

// Import Bootstrap and Ant Design CSS
import "bootstrap/dist/css/bootstrap.min.css";
import "antd/dist/reset.css";

// Import Service Worker Registration
import * as serviceWorkerRegistration from "./services/serviceWorkerRegistration";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <UserProvider>
        <RouterProvider
          router={router}
          future={{
            v7_startTransition: true,
          }}
        />
      </UserProvider>
    </AuthProvider>
  </React.StrictMode>
);

// Register service worker for offline support
serviceWorkerRegistration.register({
  onSuccess: (registration) => {
    console.log('✅ Service Worker registered successfully');
    console.log('📱 App is now available offline!');
  },
  onUpdate: (registration) => {
    console.log('🔄 New version available!');
    // The SW will dispatch a custom event that components can listen to
  },
  onError: (error) => {
    console.error('❌ Service Worker registration failed:', error);
  },
});
