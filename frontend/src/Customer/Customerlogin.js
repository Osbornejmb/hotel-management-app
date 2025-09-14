import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function CustomerLogin() {
  const [roomNumber, setRoomNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Call backend to validate room number
  const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/rooms/validate`, { roomNumber });
      if (res.data.valid) {
        localStorage.setItem('customerRoomNumber', roomNumber);
        navigate('/customer/interface'); 
      } else {
        setError('Invalid room number. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Validation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '3rem', background: '#111', minHeight: '100vh', color: '#FFD700' }}>
      <h2 style={{ color: '#FFD700', textShadow: '0 2px 8px #000', letterSpacing: '2px' }}>Customer Login</h2>
      <form onSubmit={handleSubmit} style={{ display: 'inline-block', marginTop: '2rem', background: '#222', padding: '2rem', borderRadius: '16px', boxShadow: '0 2px 16px #FFD700', color: '#FFD700', border: '2px solid #FFD700' }}>
        <input
          type="text"
          placeholder="Enter Room Number"
          value={roomNumber}
          onChange={e => setRoomNumber(e.target.value)}
          required
          style={{ padding: '0.5rem', fontSize: '1rem', borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', marginRight: '1rem' }}
        />
        <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#FFD700', color: '#222', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }} disabled={loading}
          onMouseOver={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}
          onMouseOut={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}>
          {loading ? 'Checking...' : 'Login'}
        </button>
      </form>
      {error && <p style={{ color: '#f44336', marginTop: '1rem', textShadow: '0 2px 8px #000' }}>{error}</p>}
    </div>
  );
}

export default CustomerLogin;
