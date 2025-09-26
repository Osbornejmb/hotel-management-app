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
      fontFamily: 'serif, Georgia, Times, Times New Roman, serif',
      overflow: 'hidden',
    }}>
      {/* Overlay for darkening the background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.75)',
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
        <span style={{ color: '#fff', fontSize: 32, fontFamily: 'serif', letterSpacing: 1 }}>LUMINE</span>
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
      }}>
        <div style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '3.5rem', color: '#fff', fontFamily: 'serif', fontWeight: 400, textAlign: 'center', textShadow: '0 2px 12px #000', letterSpacing: 1 }}>
            Welcome to our hotel
          </div>
          <div style={{ fontSize: '1.5rem', color: '#fff', fontFamily: 'serif', fontWeight: 300, textAlign: 'center', marginTop: '0.5rem', textShadow: '0 2px 8px #000' }}>
            Your comfort and assistance are just one click away!
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2.2rem' }}>
            <label htmlFor="roomId" style={{ color: '#fff', fontSize: '1.35rem', fontFamily: 'serif', marginRight: 18, textShadow: '0 2px 8px #000' }}>
              Enter room ID
            </label>
            <input
              id="roomId"
              type="text"
              placeholder=""
              value={roomNumber}
              onChange={e => setRoomNumber(e.target.value)}
              required
              style={{
                padding: '0.5rem 1.2rem',
                fontSize: '1.35rem',
                borderRadius: 4,
                border: 'none',
                outline: 'none',
                background: '#fff',
                color: '#222',
                minWidth: 260,
                boxShadow: '0 2px 8px #0004',
                fontFamily: 'serif',
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              background: '#bfa14a',
              color: '#fff',
              fontSize: '1.35rem',
              fontFamily: 'serif',
              border: 'none',
              borderRadius: 6,
              padding: '0.5em 2.2em',
              boxShadow: '0 2px 8px #0006',
              cursor: 'pointer',
              marginTop: 0,
              fontWeight: 400,
              transition: 'background 0.2s, color 0.2s',
            }}
            disabled={loading}
            onMouseOver={e => { e.target.style.background = '#fff'; e.target.style.color = '#bfa14a'; }}
            onMouseOut={e => { e.target.style.background = '#bfa14a'; e.target.style.color = '#fff'; }}
          >
            Proceed
          </button>
        </form>
        {error && <p style={{ color: '#f44336', marginTop: '1.5rem', textShadow: '0 2px 8px #000', fontSize: '1.1rem' }}>{error}</p>}
      </div>
    </div>
  );
}

export default CustomerLogin;
