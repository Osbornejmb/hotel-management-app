import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './RegisterPage.css';

function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'restaurantAdmin' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
  await axios.post(`${process.env.REACT_APP_API_URL}/api/users/register`, form);
      setSuccess('Registration successful! You can now login.');
      setForm({ username: '', email: '', password: '', role: 'customer' });
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h2 className="register-title">Register</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <input
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          required
          className="register-input"
          disabled={loading}
        />
        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          type="email"
          className="register-input"
          disabled={loading}
        />
        <input
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          type="password"
          className="register-input"
          disabled={loading}
        />
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          required
          className="register-select"
          disabled={loading}
        >
          <option value="restaurantAdmin">Restaurant Admin</option>
          <option value="hotelAdmin">Hotel Admin</option>
        </select>
        <button
          type="submit"
          className="register-button"
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      {error && <p className="register-error">{error}</p>}
      {success && <p className="register-success">{success}</p>}
    </div>
  );
}

export default RegisterPage;
