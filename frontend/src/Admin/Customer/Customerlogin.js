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
      const res = await axios.post('http://localhost:5000/api/rooms/validate', { roomNumber });
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
    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
      <h2>Customer Login</h2>
      <form onSubmit={handleSubmit} style={{ display: 'inline-block', marginTop: '2rem' }}>
        <input
          type="text"
          placeholder="Enter Room Number"
          value={roomNumber}
          onChange={e => setRoomNumber(e.target.value)}
          required
          style={{ padding: '0.5rem', fontSize: '1rem' }}
        />
        <button type="submit" style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }} disabled={loading}>
          {loading ? 'Checking...' : 'Login'}
        </button>
      </form>
      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
    </div>
  );
}

export default CustomerLogin;
