import { jwtDecode } from 'jwt-decode';
import React from 'react';
import { Navigate } from 'react-router-dom';

function isTokenExpired(token) {
  try {
    const decoded = jwtDecode(token);
    if (!decoded.exp) return false;
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token || isTokenExpired(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    return (
      <div style={{ background: '#111', minHeight: '100vh', color: '#FFD700', textAlign: 'center', paddingTop: '3rem' }}>
        <h2 style={{ color: '#FFD700', textShadow: '0 2px 8px #000', letterSpacing: '2px' }}>Session Expired</h2>
        <p style={{ color: '#FFD700', textShadow: '0 2px 8px #000' }}>Please login again.</p>
        <Navigate to="/login" replace />
      </div>
    );
  }

  if (!allowedRoles.includes(role)) {
    return (
      <div style={{ background: '#111', minHeight: '100vh', color: '#FFD700', textAlign: 'center', paddingTop: '3rem' }}>
        <h2 style={{ color: '#FFD700', textShadow: '0 2px 8px #000', letterSpacing: '2px' }}>Access Denied</h2>
        <p style={{ color: '#FFD700', textShadow: '0 2px 8px #000' }}>You do not have permission to view this page.</p>
        <Navigate to="/login" replace />
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
