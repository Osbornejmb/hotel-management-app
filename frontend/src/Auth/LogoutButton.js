import React from 'react';
import { useNavigate } from 'react-router-dom';

function LogoutButton({ style, children }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('name');
    navigate('/login');
  };
  return (
    <button onClick={handleLogout} style={{ margin: '1rem', background: 'transparent', border: 'none', color: '#fff', ...style }}>
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
