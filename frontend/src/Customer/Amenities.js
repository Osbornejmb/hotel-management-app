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
    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
      <h2>Amenities</h2>
      <button onClick={() => navigate('/customer/interface')} style={{ marginBottom: '2rem', padding: '0.5rem 1.5rem', fontSize: '1rem', borderRadius: '8px', border: 'none', background: '#eee', cursor: 'pointer' }}>Back to Customer Interface</button>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem', margin: '2rem 0' }}>
        {amenities.map((amenity) => (
          <div key={amenity.name} style={{ cursor: 'pointer', width: '120px' }} onClick={() => navigate(amenity.path)}>
            <img src={amenity.img} alt={amenity.name} style={{ borderRadius: '12px', boxShadow: '0 2px 8px #ccc', width: '96px', height: '96px' }} />
            <div style={{ marginTop: '0.5rem' }}>{amenity.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Amenities;
