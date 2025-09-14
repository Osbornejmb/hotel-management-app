import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div style={{ textAlign: 'center', marginTop: '3rem', background: '#111', minHeight: '100vh', color: '#FFD700' }}>
      <h1 style={{ color: '#FFD700', textShadow: '0 2px 8px #000', letterSpacing: '2px' }}>Welcome to the Restaurant & Hotel Management System</h1>
      <p style={{ color: '#FFD700', textShadow: '0 2px 8px #000' }}>
        Please <Link to="/login" style={{ color: '#FFD700', fontWeight: 'bold', textDecoration: 'underline', textShadow: '0 2px 8px #000' }}>Login</Link> or <Link to="/register" style={{ color: '#FFD700', fontWeight: 'bold', textDecoration: 'underline', textShadow: '0 2px 8px #000' }}>Register</Link> to continue.
      </p>
      <p style={{ color: '#FFD700', textShadow: '0 2px 8px #000' }}>
        <Link to="/customer/login" style={{ color: '#FFD700', fontWeight: 'bold', textDecoration: 'underline', textShadow: '0 2px 8px #000' }}>Customer Login (Room Number Only)</Link>
      </p>
    </div>
  );
}

export default Home;
