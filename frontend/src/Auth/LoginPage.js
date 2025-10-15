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
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/users/login`,
        { email, password }
      );
      const { token, role } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);

      if (role === 'restaurantAdmin') navigate('/admin/restaurant');
      else if (role === 'hotelAdmin') navigate('/admin/hotel');
      else setError('Unknown role');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
      setLoading(false);
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
