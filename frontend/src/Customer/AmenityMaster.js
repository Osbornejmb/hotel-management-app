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
  const [form, setForm] = React.useState({
    name: '',
    room: localStorage.getItem('customerRoomNumber') || '',
    date: '',
    time: '',
  });
  const [confirmed, setConfirmed] = React.useState(false);
  const [error, setError] = React.useState('');

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.room || !form.date || !form.time) {
      setError('Please fill in all fields.');
      return;
    }
    try {
      // Send reservation to backend
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          room: form.room,
          date: form.date,
          time: form.time,
          amenity: content.title
        })
      });
      const data = await res.json();
      if (res.ok) {
        setConfirmed(true);
      } else {
        setError(data.error || 'Reservation failed.');
      }
    } catch (err) {
      setError('Reservation failed.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '60vh', marginTop: '3rem', background: '#111', color: '#FFD700' }}>
      <div style={{ position: 'absolute', left: 30, top: 30 }}>
        <button onClick={() => navigate(-1)} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#222', color: '#FFD700', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
          onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
          onMouseOut={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}>
          Back
        </button>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222', borderRadius: '16px 0 0 16px', boxShadow: '0 2px 16px #FFD700' }}>
        <img src={content.img} alt={content.title} style={{ borderRadius: '16px', boxShadow: '0 2px 16px #FFD700', width: '60%', maxWidth: '400px', height: 'auto', background: '#111' }} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', padding: '2rem', background: '#222', borderRadius: '0 16px 16px 0', boxShadow: '0 2px 16px #FFD700', color: '#FFD700' }}>
        <h2 style={{ marginBottom: '1rem', color: '#FFD700', textShadow: '0 2px 8px #000', letterSpacing: '2px' }}>{content.title} Reservation</h2>
        {!confirmed ? (
          <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '400px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Name:
              <input type="text" name="name" value={form.name} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', marginBottom: '1rem' }} required />
            </label>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Room:
              <input type="text" name="room" value={form.room} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', marginBottom: '1rem' }} required />
            </label>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Date:
              <input type="date" name="date" value={form.date} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', marginBottom: '1rem' }} required />
            </label>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Time:
              <input type="time" name="time" value={form.time} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', marginBottom: '1rem' }} required />
            </label>
            <button type="submit" style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#FFD700', color: '#222', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s', marginTop: '1rem' }}
              onMouseOver={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}
              onMouseOut={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}>
              Reserve
            </button>
            {error && <p style={{ color: '#f44336', marginTop: '1rem', textShadow: '0 2px 8px #000' }}>{error}</p>}
          </form>
        ) : (
          <div style={{ marginTop: '2rem', color: '#FFD700', textShadow: '0 2px 8px #000', fontSize: '1.2rem' }}>
            <p>Reservation confirmed for <strong>{form.name}</strong> in room <strong>{form.room}</strong> on <strong>{form.date}</strong> at <strong>{form.time}</strong> for the <strong>{content.title}</strong> amenity.</p>
            <button onClick={() => navigate('/customer/amenities')} style={{ marginTop: '2rem', padding: '0.5rem 1.5rem', fontSize: '1rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#222', color: '#FFD700', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
              onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
              onMouseOut={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}>Back to Amenities</button>
          </div>
        )}
      </div>
    </div>
  );
}


export default AmenityMaster;
