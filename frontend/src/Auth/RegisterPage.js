import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'restaurantAdmin' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axios.post('http://localhost:5000/api/users/register', form);
      setSuccess('Registration successful! You can now login.');
      setForm({ username: '', email: '', password: '', role: 'customer' });
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div style={{ background: '#111', minHeight: '100vh', color: '#FFD700', textAlign: 'center', paddingTop: '3rem' }}>
      <h2 style={{ color: '#FFD700', textShadow: '0 2px 8px #000', letterSpacing: '2px' }}>Register</h2>
      <form onSubmit={handleSubmit} style={{ display: 'inline-block', background: '#222', padding: '2rem', borderRadius: '16px', boxShadow: '0 2px 16px #FFD700', color: '#FFD700', border: '2px solid #FFD700' }}>
        <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required style={{ marginBottom: '1rem', padding: '0.5rem', borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', width: '100%' }} />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required type="email" style={{ marginBottom: '1rem', padding: '0.5rem', borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', width: '100%' }} />
        <input name="password" placeholder="Password" value={form.password} onChange={handleChange} required type="password" style={{ marginBottom: '1rem', padding: '0.5rem', borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', width: '100%' }} />
        <select name="role" value={form.role} onChange={handleChange} required style={{ marginBottom: '1rem', padding: '0.5rem', borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', width: '100%' }}>
          <option value="restaurantAdmin">Restaurant Admin</option>
          <option value="hotelAdmin">Hotel Admin</option>
        </select>
        <button type="submit" style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#FFD700', color: '#222', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s', width: '100%' }}
          onMouseOver={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}
          onMouseOut={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}>
          Register
        </button>
      </form>
      {error && <p style={{color:'#f44336', textShadow: '0 2px 8px #000', marginTop: '1rem'}}>{error}</p>}
      {success && <p style={{color:'#4caf50', textShadow: '0 2px 8px #000', marginTop: '1rem'}}>{success}</p>}
    </div>
  );
}

export default RegisterPage;
