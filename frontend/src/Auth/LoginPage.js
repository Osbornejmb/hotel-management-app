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

    // helper to attempt a login endpoint and return res.data or throw
    const attemptLogin = async (url) => {
      const res = await axios.post(url, payload);
      return res.data;
    };

    try {
      let data;
      try {
        // first try the users login endpoint
        data = await attemptLogin('http://localhost:5000/api/users/login');
      } catch (firstErr) {
        // if users login fails, try employee login (singular path)
        try {
          data = await attemptLogin('http://localhost:5000/api/employee/login');
        } catch (secondErr) {
          // prefer a clear message from the server responses if available
          const msg = firstErr.response?.data?.error || secondErr.response?.data?.error || firstErr.message || 'Login failed';
          throw new Error(msg);
        }
      }

      // normalize response and store session info
      const { token, role, username, name } = data;
      if (token) localStorage.setItem('token', token);
      if (role) localStorage.setItem('role', role);
      if (username) localStorage.setItem('username', username);
      if (name) localStorage.setItem('name', name);

      // Redirect based on role:
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
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)} required />
        <button type="submit">Login</button>
      </form>
      {error && <p style={{color:'red'}}>{error}</p>}
    </div>
  );
}

export default LoginPage;
