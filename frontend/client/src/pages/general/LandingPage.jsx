import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-content">
          <h1>Free Teaching Tools for Educators</h1>
          <p className="hero-subtitle">
            Create, organize, and deliver lessons with our completely free educational platform
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="cta-primary">Get Started Now</Link>
            <Link to="/login" className="cta-secondary">Sign In</Link>
          </div>
          <p className="hero-note">No payment required. No hidden fees. Free forever.</p>
        </div>
        <div className="hero-image">
          <img src="/images/teaching-dashboard.png" alt="App dashboard preview" />
        </div>
      </header>

      {/* Features Section */}
      <section className="features-section">
        <h2>Everything You Need, Absolutely Free</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Lesson Planning</h3>
            <p>Create detailed lesson plans with our intuitive editor and free templates</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Assessment Generator</h3>
            <p>Build quizzes and tests quickly with our free question bank</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🗓️</div>
            <h3>Class Calendar</h3>
            <p>Organize your schedule with our integrated planning calendar</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>Resource Storage</h3>
            <p>Store and access all your teaching materials with free cloud storage</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="steps-section">
        <h2>Get Started in Minutes</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Create Account</h3>
            <p>Sign up with your email - completely free</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Set Up Profile</h3>
            <p>Tell us about your teaching needs</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Start Teaching</h3>
            <p>Access all features immediately with no restrictions</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <h2>Join Thousands of Educators Today</h2>
        <Link to="/register" className="cta-primary">Create Free Account</Link>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-links">
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>
        <p className="copyright">© {new Date().getFullYear()} EduFree Tools. Free forever for educators.</p>
      </footer>
    </div>
  );
};

export default LandingPage;