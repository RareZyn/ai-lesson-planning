import React from "react";
import RecentOpened from "./home/RecentOpened";
import AiToolsSection from "./home/AiToolsSection";
import MyClass from "./home/MyClass";

const HomePage = () => {
  return (
    <div className="HomePage">
      <h2 style={{ textAlign: "left" }}>HomePage</h2>

      <div style={{ marginBottom: "20px" }}>
        <AiToolsSection />
      </div>
      <div style={{ marginBottom: "20px" }}>
        <RecentOpened />
      </div>
      <div>
        <MyClass />
      </div>
    </div>
  );
};

export default HomePage;
