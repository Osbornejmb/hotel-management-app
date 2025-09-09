import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
      <h1>Welcome to the Restaurant & Hotel Management System</h1>
      <p>
        Please <Link to="/login">Login</Link> or <Link to="/register">Register</Link> to continue.
      </p>
    </div>
  );
}

export default Home;
