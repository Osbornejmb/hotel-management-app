import React from 'react';
import { useNavigate } from 'react-router-dom';

function LogoutButton() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };
  return (
    <button onClick={handleLogout} style={{ margin: '1rem' }}>
      Logout
    </button>
  );
}

export default LogoutButton;
