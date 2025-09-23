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
<<<<<<< HEAD
    <button onClick={handleLogout} style={{ margin: '1rem', background: 'transparent', border: 'none', color: '#fff', ...style }}>
      {children || (
        <>
          <span style={{ marginRight: 8 }}>⤴</span>
          Logout
        </>
      )}
=======
    <button onClick={handleLogout} style={{ margin: '1rem', padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#222', color: '#FFD700', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
      onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
      onMouseOut={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}>
      Logout
>>>>>>> 14dcae8e53acda0b405c271f37cdeb462f02c64e
    </button>
  );
}

export default LogoutButton;
