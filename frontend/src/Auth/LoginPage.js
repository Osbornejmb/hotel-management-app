import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/users/login', { email, password });
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
