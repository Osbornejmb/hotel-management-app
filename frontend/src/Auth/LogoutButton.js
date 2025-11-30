import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LogoutButton({ style = {}, children, className, ...props }) {
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
    <button
      onClick={handleLogout}
      style={{ ...baseStyle, ...style }}
      className={className}
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
    </button>
  );
}

export default LogoutButton;