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
  const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/users/login`, { email, password });
      const { token, role } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
  if (role === 'restaurantAdmin') navigate('/admin/restaurant');
  else if (role === 'hotelAdmin') navigate('/admin/hotel');
  else setError('Unknown role');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div style={{ background: '#111', minHeight: '100vh', color: '#FFD700', textAlign: 'center', paddingTop: '3rem' }}>
      <h2 style={{ color: '#FFD700', textShadow: '0 2px 8px #000', letterSpacing: '2px' }}>Login</h2>
      <form onSubmit={handleSubmit} style={{ display: 'inline-block', background: '#222', padding: '2rem', borderRadius: '16px', boxShadow: '0 2px 16px #FFD700', color: '#FFD700', border: '2px solid #FFD700' }}>
        <input type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)} required style={{ marginBottom: '1rem', padding: '0.5rem', borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', width: '100%' }} />
        <input type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)} required style={{ marginBottom: '1rem', padding: '0.5rem', borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', width: '100%' }} />
        <button type="submit" style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#FFD700', color: '#222', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s', width: '100%' }}
          onMouseOver={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}
          onMouseOut={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}>
          Login
        </button>
      </form>
      {error && <p style={{color:'#f44336', textShadow: '0 2px 8px #000', marginTop: '1rem'}}>{error}</p>}
    </div>
  );
}

export default LoginPage;
