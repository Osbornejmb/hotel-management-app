import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <div className="home-content">
        {/* Logo and Title */}
        <div className="home-header">
          <img 
            src='/lumine_icon.png' 
            alt="Lumine Logo" 
            className="home-logo" 
          />
          <h1 className="home-title">Lumine Hotel</h1>
          <p className="home-subtitle">Restaurant & Hotel Management System</p>
        </div>

        {/* Main Navigation Cards */}
        <div className="home-cards-grid">
          {/* Staff/Admin Login */}
          <Link to="/login" className="home-card home-card-staff">
            <div className="home-card-icon">
              <svg className="card-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="home-card-title">Staff Login</h2>
            <p className="home-card-description">Access as admin or hotel staff</p>
            <div className="home-card-button">Login</div>
          </Link>

          {/* Register */}
          <Link to="/register" className="home-card home-card-register">
            <div className="home-card-icon">
              <svg className="card-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="home-card-title">Register</h2>
            <p className="home-card-description">Create a new staff account</p>
            <div className="home-card-button">Register</div>
          </Link>

          {/* Customer Login */}
          <Link to="/customer/login" className="home-card home-card-customer">
            <div className="home-card-icon">
              <svg className="card-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="home-card-title">Guest Access</h2>
            <p className="home-card-description">Order from your room (room number only)</p>
            <div className="home-card-button">Enter Room Number</div>
          </Link>
        </div>

        {/* Footer Info */}
        <div className="home-footer">
          <p className="home-footer-text">
            Welcome to Lumine Hotel. Choose your access method above to continue.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
