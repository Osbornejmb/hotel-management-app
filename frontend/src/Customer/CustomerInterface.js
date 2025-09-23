
import { useNavigate } from 'react-router-dom';

import { useEffect } from 'react';

function CustomerInterface() {
  const roomNumber = localStorage.getItem('customerRoomNumber');
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomNumber) {
      navigate('/customer/login', { replace: true });
    }
  }, [roomNumber, navigate]);

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('customerRoomNumber');
    navigate('/customer/login', { replace: true });
  };

  if (!roomNumber) return null;

  return (
    <div style={{ textAlign: 'center', marginTop: '3rem', background: '#111', minHeight: '100vh', color: '#FFD700' }}>
      <h2 style={{ color: '#FFD700', textShadow: '0 2px 8px #000', letterSpacing: '2px' }}>Customer Interface</h2>
      <p style={{ color: '#FFD700', textShadow: '0 2px 8px #000' }}>Welcome! Your room number is <strong>{roomNumber}</strong>.</p>
      <button onClick={handleLogout} style={{ position: 'fixed', top: '2rem', right: '2rem', padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#222', color: '#FFD700', fontWeight: 'bold', cursor: 'pointer', zIndex: 1100, boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
        onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
        onMouseOut={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}>Logout</button>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', margin: '2rem 0' }}>
        <div style={{ cursor: 'pointer', width: '120px', background: '#222', borderRadius: '16px', boxShadow: '0 2px 12px #FFD700', padding: '1rem', transition: 'transform 0.2s, box-shadow 0.2s' }}
          onClick={() => handleNavigate('/customer/amenities')}
          onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.07)'; e.currentTarget.style.boxShadow = '0 4px 24px #FFD700'; }}
          onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 12px #FFD700'; }}>
          <img src="https://img.icons8.com/color/96/000000/room.png" alt="Amenities" style={{ borderRadius: '12px', boxShadow: '0 2px 8px #FFD700', background: '#111' }} />
          <div style={{ marginTop: '0.5rem', color: '#FFD700', fontWeight: 'bold', textShadow: '0 2px 8px #000' }}>Amenities</div>
        </div>
        <div style={{ cursor: 'pointer', width: '120px', background: '#222', borderRadius: '16px', boxShadow: '0 2px 12px #FFD700', padding: '1rem', transition: 'transform 0.2s, box-shadow 0.2s' }}
          onClick={() => handleNavigate('/customer/food')}
          onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.07)'; e.currentTarget.style.boxShadow = '0 4px 24px #FFD700'; }}
          onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 12px #FFD700'; }}>
          <img src="https://img.icons8.com/color/96/000000/restaurant.png" alt="Food and Beverages" style={{ borderRadius: '12px', boxShadow: '0 2px 8px #FFD700', background: '#111' }} />
          <div style={{ marginTop: '0.5rem', color: '#FFD700', fontWeight: 'bold', textShadow: '0 2px 8px #000' }}>Food & Beverages</div>
        </div>
        <div style={{ cursor: 'pointer', width: '120px', background: '#222', borderRadius: '16px', boxShadow: '0 2px 12px #FFD700', padding: '1rem', transition: 'transform 0.2s, box-shadow 0.2s' }}
          onClick={() => handleNavigate('/customer/contact')}
          onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.07)'; e.currentTarget.style.boxShadow = '0 4px 24px #FFD700'; }}
          onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 12px #FFD700'; }}>
          <img src="https://img.icons8.com/color/96/000000/phone.png" alt="Contact Front Desk" style={{ borderRadius: '12px', boxShadow: '0 2px 8px #FFD700', background: '#111' }} />
          <div style={{ marginTop: '0.5rem', color: '#FFD700', fontWeight: 'bold', textShadow: '0 2px 8px #000' }}>Contact Front Desk</div>
        </div>
      </div>
    </div>
  );
}

export default CustomerInterface;
