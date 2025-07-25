// src/components/layout/MainLayout.jsx
import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Breadcrumb from "./Breadcrumb";
import { Outlet } from "react-router-dom";
import "./MainLayout.css";

const MainLayout = () => {
  return (
    <div className="app-container">
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
