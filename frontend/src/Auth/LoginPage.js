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
    try {
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${apiBase}/api/users/login`, { email, password });
      const { token, role, username, name } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      if (username) localStorage.setItem('username', username);
      if (name) localStorage.setItem('name', name);

      if (role === 'restaurantAdmin') navigate('/admin/restaurant');
      else if (role === 'hotelAdmin') navigate('/admin/hotel');
      else if (role === 'employeeAdmin' || role === 'employee') navigate('/admin/employee');
      else setError('Unknown role');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Login</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="login-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="login-input"
        />
        <button
          type="submit"
          className="login-button"
        >
          Login
        </button>
      </form>
      {error && <p className="login-error">{error}</p>}
    </div>
  );
}

export default LoginPage;
