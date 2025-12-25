// src/components/layout/MainLayout.jsx
import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Breadcrumb from "./Breadcrumb";
import { Outlet } from "react-router-dom";
import NetworkStatus from "../components/NetworkStatus/NetworkStatus";
import UpdateNotification from "../components/NetworkStatus/UpdateNotification";
import NotificationListener from "../components/common/NotificationListener";
import "./MainLayout.css";

const MainLayout = () => {
  return (
    <div className="app-container">
      {/* Service Worker Update Notification */}
      <UpdateNotification />

      {/* Real-time Notification Listener */}
      <NotificationListener />

      {/* Network Status Banner */}
      <NetworkStatus showOnlineStatus={false} />

      <Navbar />
      <div className="content-wrapper">
        <Sidebar />
        <div className="content-area">
          <main className="main-content">
            <Breadcrumb />
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
