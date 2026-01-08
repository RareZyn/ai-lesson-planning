// src/index.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { UserProvider } from "./context/UserContext";
import { SocketProvider } from "./context/SocketContext";
import { BreadcrumbProvider } from "./context/BreadcrumbContext";
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
        <SocketProvider>
          <BreadcrumbProvider>
            <RouterProvider
              router={router}
              future={{
                v7_startTransition: true,
              }}
            />
          </BreadcrumbProvider>
        </SocketProvider>
      </UserProvider>
    </AuthProvider>
  </React.StrictMode>
);

// Register service worker for offline support
// Use environment variable to control registration
// Set REACT_APP_ENABLE_SW=true to test PWA in development
const shouldEnableSW =
  process.env.NODE_ENV === 'production' ||
  process.env.REACT_APP_ENABLE_SW === 'true';

// Only run service worker logic after page has fully loaded
// to avoid interfering with HMR in development
if (shouldEnableSW) {
  console.log('🔧 Service Worker: Enabled');

  // Wait for page load to register service worker
  if (document.readyState === 'complete') {
    registerServiceWorker();
  } else {
    window.addEventListener('load', registerServiceWorker);
  }
} else {

  // Unregister any existing service workers in development
  // This prevents old service workers from interfering
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      if (registrations.length > 0) {
        registrations.forEach((registration) => {
          registration.unregister().then(() => {
            console.log('🧹 Unregistered existing service worker');
          });
        });

        // Clear all caches after unregistering service worker
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              console.log('🗑️ Deleting cache:', cacheName);
              return caches.delete(cacheName);
            })
          );
        });
      }
    });
  }
}

function registerServiceWorker() {
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
}
