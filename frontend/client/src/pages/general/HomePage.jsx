import React from "react";
import RecentOpened from "./Home/RecentOpened";
import AITools from "./Home/AITools";
import RecentClasses from "./Home/RecentClasses";

const HomePage = () => {
  return (
    <div className="HomePage">
      <h2 style={{ textAlign: "left" }}>HomePage</h2>
      <div> 
        <AITools />
        <RecentOpened />
        <RecentClasses />
      </div>
    </div>
  );
};

export default HomePage;
