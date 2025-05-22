import React from 'react';
import './Navbar.css'
import Searchbar from '../components/Searchbar';
import Profile from '../components/Profile';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Left group - logo and search */}
        <div className="navbar-left-group">
          {/* Logo */}
          <div className="navbar-logo">
            <img
              src="./../logo/LessonPlanning.png"
              alt="Company Logo"
              className="logo-img"
            />
          </div>

          <Searchbar
            placeholder="Type to search materials, lesson etc..."
            onSearch={(value) => console.log(value)}
            className="navbar-search-input"
          />
        </div>
        <div className="navbar-right-group">
          <Profile />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;