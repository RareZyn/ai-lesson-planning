import React from "react";
import RecentOpened from "./Home/RecentOpened";

const HomePage = () => {
  return (
    <div className="HomePage">
      <h2 style={{ textAlign: "left" }}>HomePage</h2>
      <div> 
        <RecentOpened />
      </div>
    </div>
  );
};

export default HomePage;
