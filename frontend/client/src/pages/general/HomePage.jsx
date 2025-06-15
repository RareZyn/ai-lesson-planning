import React from "react";
import RecentOpened from "./home/RecentOpened";
import AITools from "./home/AITools";
import RecentClasses from "./home/RecentClasses";
// Remove Breadcrumb import - it's already in MainLayout

const HomePage = () => {
  // Remove customBreadcrumbs - let MainLayout handle it
  return (
    <div className="HomePage">
      <div className="home-container" style={{ width: "100%" }}>
        <AITools />
        <RecentOpened />
        <RecentClasses />
      </div>
    </div>
  );
};

export default HomePage;
