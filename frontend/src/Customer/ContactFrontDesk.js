import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function ContactFrontDesk() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [roomNumber, setRoomNumber] = useState(localStorage.getItem('customerRoomNumber') || '');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  React.useEffect(() => {
    if (!localStorage.getItem('customerRoomNumber')) {
      navigate('/customer/login', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
  await axios.post(`${process.env.REACT_APP_API_URL}/api/contact`, {
        name,
        roomNumber,
        message,
      });
      setStatus('Message sent successfully!');
      setMessage('');
    } catch (err) {
      setStatus('Failed to send message. Please try again.');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '3rem', background: '#111', minHeight: '100vh', color: '#FFD700' }}>
      <h2 style={{ color: '#FFD700', textShadow: '0 2px 8px #000', letterSpacing: '2px' }}>Contact Front Desk</h2>
      <button onClick={() => navigate('/customer/interface')} style={{ position: 'fixed', top: '2rem', left: '2rem', padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#222', color: '#FFD700', fontWeight: 'bold', cursor: 'pointer', zIndex: 1100, boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
        onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
        onMouseOut={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}>Back</button>
      <form onSubmit={handleSubmit} style={{ display: 'inline-block', textAlign: 'left', marginTop: '2rem', minWidth: '320px', background: '#222', padding: '2rem', borderRadius: '16px', boxShadow: '0 2px 16px #FFD700', color: '#FFD700', border: '2px solid #FFD700' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: '#FFD700' }}>Name:</label><br />
          <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #FFD700', background: '#111', color: '#FFD700' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: '#FFD700' }}>Room Number:</label><br />
          <input type="text" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #FFD700', background: '#111', color: '#FFD700' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: '#FFD700' }}>Your Message:</label><br />
          <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={4} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #FFD700', background: '#111', color: '#FFD700' }} />
        </div>
        <button type="submit" style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#FFD700', color: '#222', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
          onMouseOver={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}
          onMouseOut={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}>Send</button>
      </form>
      {status && <p style={{ marginTop: '1rem', color: status.includes('success') ? '#4caf50' : '#f44336', textShadow: '0 2px 8px #000' }}>{status}</p>}
    </div>
  );
}

export default ContactFrontDesk;
