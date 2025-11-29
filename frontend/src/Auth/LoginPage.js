import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LoginPage.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const payload = { email, password };

    // Helper to attempt a login endpoint and return res.data or throw
    const attemptLogin = async (url) => {
      const res = await axios.post(url, payload);
      return res.data;
    };

    try {
      let data;
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      try {
        // First try the users login endpoint
        data = await attemptLogin(`${apiBase}/api/users/login`);
      } catch (firstErr) {
        // If users login fails, try employee login
        try {
          data = await attemptLogin(`${apiBase}/api/employee/login`);
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

      // Normalize response and store session info
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
      setError(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
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
            placeholder="Username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="login-input"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
            disabled={loading}
          />
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}

export default LoginPage;