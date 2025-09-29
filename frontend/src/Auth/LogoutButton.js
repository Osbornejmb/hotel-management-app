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
    <button onClick={handleLogout} className="hotel-admin-dashboard-logout-btn-actual">
      Logout
    </button>
  );
}

export default LogoutButton;
