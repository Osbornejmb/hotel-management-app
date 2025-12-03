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

  const bgUrl = 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Corinthia_London%2C_Hotel_Front_Exterior.jpg';

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: `url(${bgUrl}) center center / cover no-repeat fixed`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Overlay for darkening the background - Lumine amber theme */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.4)',
        zIndex: 1,
      }} />
      {/* Logo and brand top left */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 18,
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
      }}>
        <img src={process.env.PUBLIC_URL + '/logo192.png'} alt="Lumine Logo" style={{ height: 38, width: 38, marginRight: 10, objectFit: 'contain', filter: 'brightness(1.2)' }} />
        <span style={{ color: '#fef3c7', fontSize: 32, letterSpacing: 1, fontWeight: 700 }}>LUMINE</span>
      </div>
      {/* Centered login content */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem 1rem',
      }}>
        <div style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '3.5rem', color: '#fef3c7', fontWeight: 700, textAlign: 'center', letterSpacing: 1 }}>
            Welcome to our hotel
          </div>
          <div style={{ fontSize: '1.5rem', color: '#fcd34d', fontWeight: 300, textAlign: 'center', marginTop: '0.5rem' }}>
            Your comfort and assistance are just one click away!
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '1.5rem', width: '100%', maxWidth: 500 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '2.2rem', width: '100%' }}>
            <label htmlFor="roomId" style={{ color: '#fef3c7', fontSize: '1.2rem', marginBottom: '0.75rem', fontWeight: 600 }}>
              Enter room ID
            </label>
            <input
              id="roomId"
              type="text"
              placeholder="e.g., 101, 205"
              value={roomNumber}
              onChange={e => setRoomNumber(e.target.value)}
              required
              style={{
                padding: '0.85rem 1rem',
                fontSize: '1.1rem',
                borderRadius: 8,
                border: '2px solid #fcd34d',
                outline: 'none',
                background: '#fffbeb',
                color: '#78350f',
                width: '100%',
                boxSizing: 'border-box',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#f59e0b';
                e.target.style.background = '#fef3c7';
                e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#fcd34d';
                e.target.style.background = '#fffbeb';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              color: '#fff',
              fontSize: '1.2rem',
              border: 'none',
              borderRadius: 8,
              padding: '0.85rem 2.5rem',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
              cursor: 'pointer',
              marginTop: 0,
              fontWeight: 700,
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              width: '100%',
            }}
            disabled={loading}
            onMouseOver={e => {
              e.target.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(217, 119, 6, 0.4)';
            }}
            onMouseOut={e => {
              e.target.style.background = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
            }}
          >
            {loading ? 'Validating...' : 'Proceed'}
          </button>
        </form>
        {error && <p style={{ color: '#fca5a5', marginTop: '1.5rem', fontSize: '1.1rem', fontWeight: 600, backgroundColor: 'rgba(220, 38, 38, 0.15)', padding: '0.75rem', borderRadius: '0.5rem', border: '2px solid #fca5a5', maxWidth: 500, textAlign: 'center' }}>{error}</p>}
      </div>
    </div>
  );
}

export default CustomerLogin;
