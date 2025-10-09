import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LoginPage.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = { email, password };

    // Helper to attempt a login endpoint and return res.data or throw
    const attemptLogin = async (url) => {
      const res = await axios.post(url, payload, {
        withCredentials: true // ⚠️ CRITICAL: This sends cookies/session
      });
      return res.data;
    };

    try {
      let data;
      try {
        // First try the users login endpoint
        data = await attemptLogin('http://localhost:5000/api/users/login');
      } catch (firstErr) {
        // If users login fails, try employee login
        try {
          data = await attemptLogin('http://localhost:5000/api/employee/login');
        } catch (secondErr) {
          // Prefer a clear message from the server responses if available
          const msg = 
            firstErr.response?.data?.error || 
            secondErr.response?.data?.error || 
            firstErr.message || 
            'Login failed';
          throw new Error(msg);
        }
      }

      console.log('✅ Login response:', data);

      // For employee login, handle both session and JWT
      if (data.success && data.employee) {
        // Store employee data in localStorage
        localStorage.setItem('employee', JSON.stringify(data.employee));
        if (data.token) {
          localStorage.setItem('employee_token', data.token);
        }
        
        // Redirect to employee dashboard
        navigate('/user/employeeMainDashboard');
        return;
      }

      // For other user types (existing logic)
      const { token, role, username, name } = data;
      if (token) localStorage.setItem('token', token);
      if (role) localStorage.setItem('role', role);
      if (username) localStorage.setItem('username', username);
      if (name) localStorage.setItem('name', name);

      // Redirect based on role
      if (role === 'restaurantAdmin') {
        navigate('/admin/restaurant');
      } else if (role === 'hotelAdmin') {
        navigate('/admin/hotel');
      } else if (role === 'employeeAdmin') {
        navigate('/admin/employee');
      } else if (role === 'employee') {
        navigate('/user/employeeMainDashboard');
      } else {
        setError('Unknown role');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.response?.data?.error || err.message || 'Login failed');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-header">
        <img src="/lumine_logo.png" alt="Lumine Logo" className="login-logo" />
      </div>

      <div className="login-box">
        <h3 className="login-role">Admin</h3>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="Email or Username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="login-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
          />
          <button type="submit" className="login-button">
            Login
          </button>
        </form>
        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}

export default LoginPage;