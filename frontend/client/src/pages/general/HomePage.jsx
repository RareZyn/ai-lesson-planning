import React from "react";
import RecentOpened from "./Home/RecentOpened";
import AITools from "./Home/AITools";
import RecentClasses from "./Home/RecentClasses";
import Breadcrumb from "../../layout/Breadcrumb";

const HomePage = () => {
  const customBreadcrumbs = [
    { label: "Home" }
  ];
  return (
    <div className="HomePage">
      <h2 style={{ textAlign: "left" }}>HomePage</h2>
      <div>
        <Breadcrumb customBreadcrumbs={customBreadcrumbs} />
      </div>
      <div>
        <AITools />
        <RecentOpened />
        <RecentClasses />
      </div>
    </div>
  );
};

export default HomePage;
