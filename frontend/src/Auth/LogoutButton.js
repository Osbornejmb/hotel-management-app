
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LogoutButton({ style = {}, children, ...props }) {
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('name');
    navigate('/login');
  };

  const baseStyle = {
    margin: '1rem',
    padding: '0.5rem 1.25rem',
    borderRadius: 8,
    border: '2px solid #FFD700',
    background: hover ? '#FFD700' : '#222',
    color: hover ? '#222' : '#FFD700',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    transition: 'background 0.15s, color 0.15s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
<<<<<<< HEAD
    <button
      onClick={handleLogout}
      style={{ ...baseStyle, ...style }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...props}
    >
      {children || (
        <>
          <span style={{ marginRight: 8 }}>⤴</span>
          Logout
        </>
      )}
=======
    <button onClick={handleLogout} className="hotel-admin-dashboard-logout-btn-actual">
      Logout
>>>>>>> 015cb928575969fbd66d88cf5ecde571135a03d3
    </button>
  );
}

export default LogoutButton;
