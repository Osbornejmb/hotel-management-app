import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Amenities.css';

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
    <div className="amenities-container">
      <h2 className="amenities-title">Amenities</h2>
      <button onClick={() => navigate('/customer/interface')} className="back-button">Back to Customer Interface</button>
      <div className="amenities-list">
        {amenities.map((amenity) => (
          <div key={amenity.name} className="amenity-item" onClick={() => navigate(amenity.path)}>
            <img src={amenity.img} alt={amenity.name} className="amenity-image" />
            <div className="amenity-name">{amenity.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Amenities;
