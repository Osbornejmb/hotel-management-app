import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <h1 className="home-title">Welcome to the Restaurant & Hotel Management System</h1>
      <p className="home-text">
        Please <Link to="/login" className="home-link">Login</Link> or <Link to="/register" className="home-link">Register</Link> to continue.
      </p>
      <p className="home-text">
        <Link to="/customer/login" className="home-link">Customer Login (Room Number Only)</Link>
      </p>
    </div>
  );
}

export default Home;
