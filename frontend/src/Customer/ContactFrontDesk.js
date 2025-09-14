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
      await axios.post('http://localhost:5000/api/contact', {
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
    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
      <h2>Contact Front Desk</h2>
      <button onClick={() => navigate('/customer/interface')} style={{ position: 'fixed', top: '2rem', left: '2rem', padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', background: '#2196f3', color: '#fff', fontWeight: 'bold', cursor: 'pointer', zIndex: 1100 }}>Back</button>
      <form onSubmit={handleSubmit} style={{ display: 'inline-block', textAlign: 'left', marginTop: '2rem', minWidth: '320px' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Name:</label><br />
          <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Room Number:</label><br />
          <input type="text" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Your Message:</label><br />
          <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={4} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }} />
        </div>
        <button type="submit" style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', background: '#2196f3', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>Send</button>
      </form>
      {status && <p style={{ marginTop: '1rem', color: status.includes('success') ? 'green' : 'red' }}>{status}</p>}
    </div>
  );
}

export default ContactFrontDesk;
