import React from "react";
import RecentOpened from "./Home/RecentOpened";
import AITools from "./Home/AITools";
import RecentClasses from "./Home/RecentClasses";
// Remove Breadcrumb import - it's already in MainLayout

const HomePage = () => {
  // Remove customBreadcrumbs - let MainLayout handle it
  return (
    <div className="HomePage">
      <h2 style={{ textAlign: "left" }}>HomePage</h2>
      <div className="home-container" style={{ width: "100%" }}>
        <AITools />
        <RecentOpened />
        <RecentClasses />
      </div>
    </div>
  );
};

export default HomePage;
