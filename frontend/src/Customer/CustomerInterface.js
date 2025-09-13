
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
    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
      <h2>Customer Interface</h2>
      <p>Welcome! Your room number is <strong>{roomNumber}</strong>.</p>
      <button onClick={handleLogout} style={{ position: 'fixed', top: '2rem', right: '2rem', padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', background: '#f44336', color: '#fff', fontWeight: 'bold', cursor: 'pointer', zIndex: 1100 }}>Logout</button>
      <button onClick={() => navigate(-1)} style={{ position: 'fixed', top: '2rem', left: '2rem', padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', background: '#2196f3', color: '#fff', fontWeight: 'bold', cursor: 'pointer', zIndex: 1100 }}>Back</button>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', margin: '2rem 0' }}>
        <div style={{ cursor: 'pointer' }} onClick={() => handleNavigate('/customer/amenities')}>
          <img src="https://img.icons8.com/color/96/000000/room.png" alt="Amenities" style={{ borderRadius: '12px', boxShadow: '0 2px 8px #ccc' }} />
          <div>Amenities</div>
        </div>
        <div style={{ cursor: 'pointer' }} onClick={() => handleNavigate('/customer/food')}> 
          <img src="https://img.icons8.com/color/96/000000/restaurant.png" alt="Food and Beverages" style={{ borderRadius: '12px', boxShadow: '0 2px 8px #ccc' }} />
          <div>Food & Beverages</div>
        </div>
        <div style={{ cursor: 'pointer' }} onClick={() => handleNavigate('/customer/contact')}> 
          <img src="https://img.icons8.com/color/96/000000/phone.png" alt="Contact Front Desk" style={{ borderRadius: '12px', boxShadow: '0 2px 8px #ccc' }} />
          <div>Contact Front Desk</div>
        </div>
      </div>
    </div>
  );
}

export default CustomerInterface;
