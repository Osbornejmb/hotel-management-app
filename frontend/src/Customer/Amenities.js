import React from 'react';

import { useNavigate } from 'react-router-dom';

function Amenities() {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!localStorage.getItem('customerRoomNumber')) {
      navigate('/customer/login', { replace: true });
    }
  }, [navigate]);

  const amenities = [
    {
      name: 'Fitness Room',
      img: 'https://img.icons8.com/color/96/000000/dumbbell.png',
      path: '/customer/amenities/fitness',
    },
    {
      name: 'Spa',
      img: 'https://img.icons8.com/color/96/000000/spa.png',
      path: '/customer/amenities/spa',
    },
    {
      name: 'Conference',
      img: 'https://img.icons8.com/color/96/000000/conference-call.png',
      path: '/customer/amenities/conference',
    },
    {
      name: 'Parking',
      img: 'https://img.icons8.com/color/96/000000/parking.png',
      path: '/customer/amenities/parking',
    },
    {
      name: 'Kids Playroom',
      img: 'https://img.icons8.com/color/96/000000/toy-car.png',
      path: '/customer/amenities/kids-playroom',
    },
    {
      name: 'Pool',
      img: 'https://img.icons8.com/color/96/000000/swimming-pool.png',
      path: '/customer/amenities/pool',
    },
  ];

  return (
    <div style={{ textAlign: 'center', marginTop: '3rem', background: '#111', minHeight: '100vh', color: '#FFD700' }}>
      <h2 style={{ color: '#FFD700', textShadow: '0 2px 8px #000', letterSpacing: '2px' }}>Amenities</h2>
      <button onClick={() => navigate('/customer/interface')} style={{ marginBottom: '2rem', padding: '0.5rem 1.5rem', fontSize: '1rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#222', color: '#FFD700', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
        onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
        onMouseOut={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}>Back to Customer Interface</button>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem', margin: '2rem 0' }}>
        {amenities.map((amenity) => (
          <div key={amenity.name} style={{ cursor: 'pointer', width: '120px', background: '#222', borderRadius: '16px', boxShadow: '0 2px 12px #FFD700', padding: '1rem', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onClick={() => navigate(amenity.path)}
            onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.07)'; e.currentTarget.style.boxShadow = '0 4px 24px #FFD700'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 12px #FFD700'; }}>
            <img src={amenity.img} alt={amenity.name} style={{ borderRadius: '12px', boxShadow: '0 2px 8px #FFD700', width: '96px', height: '96px', background: '#111' }} />
            <div style={{ marginTop: '0.5rem', color: '#FFD700', fontWeight: 'bold', textShadow: '0 2px 8px #000' }}>{amenity.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Amenities;
