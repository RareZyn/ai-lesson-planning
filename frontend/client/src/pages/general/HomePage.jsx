import React from "react";
import RecentOpened from "../general/home/RecentOpened";
import AITools from "../general/home/AITools";
import RecentClasses from "../general/home/RecentClasses";
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
