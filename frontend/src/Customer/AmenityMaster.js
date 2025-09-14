import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const amenityContent = {
  fitness: {
    title: 'Fitness Room',
    description: 'Access our state-of-the-art fitness room. Reserve equipment or request a personal trainer. (Feature coming soon)',
    img: 'https://img.icons8.com/color/96/000000/dumbbell.png',
  },
  spa: {
    title: 'Spa',
    description: 'Relax and rejuvenate in our spa. Book massages, facials, and more. (Feature coming soon)',
    img: 'https://img.icons8.com/color/96/000000/spa.png',
  },
  conference: {
    title: 'Conference',
    description: 'Reserve our conference facilities for meetings and events. (Feature coming soon)',
    img: 'https://img.icons8.com/color/96/000000/conference-call.png',
  },
  parking: {
    title: 'Parking',
    description: 'Request parking space or valet service. (Feature coming soon)',
    img: 'https://img.icons8.com/color/96/000000/parking.png',
  },
  'kids-playroom': {
    title: 'Kids Playroom',
    description: 'Let your children enjoy our safe and fun playroom. (Feature coming soon)',
    img: 'https://img.icons8.com/color/96/000000/toy-car.png',
  },
  pool: {
    title: 'Pool',
    description: 'Enjoy our swimming pool. Request towels or poolside service. (Feature coming soon)',
    img: 'https://img.icons8.com/color/96/000000/swimming-pool.png',
  },
};

function AmenityMaster() {
  const { amenity } = useParams();
  const navigate = useNavigate();
  const content = amenityContent[amenity];

  React.useEffect(() => {
    if (!localStorage.getItem('customerRoomNumber')) {
      navigate('/customer/login', { replace: true });
    }
  }, [navigate]);

  if (!content) {
    return (
      <div style={{ textAlign: 'center', marginTop: '3rem', background: '#111', minHeight: '100vh', color: '#FFD700' }}>
        <h2 style={{ color: '#FFD700', textShadow: '0 2px 8px #000', letterSpacing: '2px' }}>Amenity Not Found</h2>
        <p style={{ color: '#FFD700', textShadow: '0 2px 8px #000' }}>The requested amenity does not exist.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '60vh', marginTop: '3rem', background: '#111', color: '#FFD700' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222', borderRadius: '16px 0 0 16px', boxShadow: '0 2px 16px #FFD700' }}>
        <img src={content.img} alt={content.title} style={{ borderRadius: '16px', boxShadow: '0 2px 16px #FFD700', width: '60%', maxWidth: '400px', height: 'auto', background: '#111' }} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', padding: '2rem', background: '#222', borderRadius: '0 16px 16px 0', boxShadow: '0 2px 16px #FFD700', color: '#FFD700' }}>
        <h2 style={{ marginBottom: '1rem', color: '#FFD700', textShadow: '0 2px 8px #000', letterSpacing: '2px' }}>{content.title}</h2>
        <p style={{ marginBottom: '2rem', fontSize: '1.1rem', color: '#FFD700', textShadow: '0 2px 8px #000' }}>{content.description}</p>
        <p style={{ marginTop: '2rem', fontSize: '1rem', color: '#FFD700', textShadow: '0 2px 8px #000' }}>
          {getAmenityParagraph(amenity)}
        </p>
        <button onClick={() => navigate('/customer/amenities')} style={{ marginTop: '2rem', padding: '0.5rem 1.5rem', fontSize: '1rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#222', color: '#FFD700', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
          onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
          onMouseOut={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}>Back to Amenities</button>
      </div>
    </div>
  );
}

// Helper function for amenity-specific paragraph
function getAmenityParagraph(amenity) {
  switch (amenity) {
    case 'fitness':
      return 'Stay fit during your stay! Our fitness room offers modern equipment and personal training sessions.';
    case 'spa':
      return 'Unwind and relax in our spa. Enjoy massages, facials, and wellness treatments.';
    case 'conference':
      return 'Host your meetings and events in our fully equipped conference facilities.';
    case 'parking':
      return 'Convenient parking and valet services are available for all guests.';
    case 'kids-playroom':
      return 'Kids can have fun in our safe and engaging playroom, filled with toys and games.';
    case 'pool':
      return 'Take a dip in our refreshing pool, with poolside service and towel requests available.';
    default:
      return '';
  }
}

export default AmenityMaster;
