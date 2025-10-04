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
    <div style={{ 
      textAlign: 'center', 
      margin: 0, 
      background: '#fff', 
      height: '100vh', 
      fontFamily: 'Cinzel, serif',
      padding: '0',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Compact Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#4B2E06',
        padding: '0.3rem 0 0.3rem 0.8rem',
        boxSizing: 'border-box',
        boxShadow: '0 2px 8px #BFA06A',
        flexShrink: 0,
        height: '45px'
      }}>
        <img
          src="/lumine_icon.png"
          alt="Lumine Logo"
          style={{
            height: '28px',
            width: '28px',
            marginRight: '8px',
            objectFit: 'contain',
            background: 'transparent',
            borderRadius: 0,
            boxShadow: 'none'
          }}
        />
        <span style={{
          color: '#fff',
          fontSize: '22px',
          fontFamily: 'Cinzel, serif',
          letterSpacing: 1,
          textShadow: '0 2px 8px #BFA06A'
        }}>Lumine</span>
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0.5rem',
        boxSizing: 'border-box',
        overflow: 'hidden',
        minHeight: 0
      }}>
        {/* Back Button */}
        <div style={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'flex-start', 
          alignItems: 'center',
          marginBottom: '0.5rem',
          flexShrink: 0
        }}>
          <button
            onClick={() => navigate('/customer/interface')}
            style={{
              padding: '0.3rem 0.8rem',
              borderRadius: '6px',
              border: '2px solid #BFA06A',
              background: '#F7D774',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 8px #BFA06A',
              transition: 'background 0.2s, color 0.2s',
              fontFamily: 'Cinzel, serif',
              color: '#000',
              fontSize: '12px'
            }}
            onMouseOver={e => { e.target.style.background = '#BFA06A'; e.target.style.color = '#000'; }}
            onMouseOut={e => { e.target.style.background = '#F7D774'; e.target.style.color = '#000'; }}
          >Back</button>
        </div>

        {/* Title */}
        <h2 style={{ 
          letterSpacing: '1px', 
          fontFamily: 'Cinzel, serif',
          fontSize: '1.1rem',
          margin: '0 0 0.8rem 0',
          color: '#000',
          flexShrink: 0
        }}>Contact Front Desk</h2>

        {/* Contact Form Container */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 0,
          width: '100%',
          maxHeight: 'calc(100vh - 120px)' // Account for browser chrome
        }}>
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              textAlign: 'left',
              width: 'min(350px, 95vw)',
              background: '#fff',
              padding: '1rem',
              borderRadius: '12px',
              boxShadow: '0 2px 16px #FFD700',
              color: '#000',
              border: '2px solid #BFA06A',
              fontFamily: 'Cinzel, serif',
              boxSizing: 'border-box',
              maxHeight: '100%',
              overflow: 'hidden'
            }}
          >
            <div style={{ 
              marginBottom: '0.8rem',
              flexShrink: 0
            }}>
              <label style={{ 
                color: '#000000ff', 
                fontFamily: 'Cinzel, serif',
                fontSize: '12px',
                display: 'block',
                marginBottom: '0.3rem'
              }}>Name:</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.3rem',
                  borderRadius: '4px',
                  border: '1px solid #BFA06A',
                  background: '#fff',
                  color: '#000',
                  fontFamily: 'Cinzel, serif',
                  fontSize: '12px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ 
              marginBottom: '0.8rem',
              flexShrink: 0
            }}>
              <label style={{ 
                color: '#000000ff', 
                fontFamily: 'Cinzel, serif',
                fontSize: '12px',
                display: 'block',
                marginBottom: '0.3rem'
              }}>Room Number:</label>
              <input
                type="text"
                value={roomNumber}
                onChange={e => setRoomNumber(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.3rem',
                  borderRadius: '4px',
                  border: '1px solid #BFA06A',
                  background: '#fff',
                  color: '#000',
                  fontFamily: 'Cinzel, serif',
                  fontSize: '12px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ 
              marginBottom: '0.8rem',
              flex: 1,
              minHeight: 0
            }}>
              <label style={{ 
                color: '#000000ff', 
                fontFamily: 'Cinzel, serif',
                fontSize: '12px',
                display: 'block',
                marginBottom: '0.3rem'
              }}>Your Message:</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.3rem',
                  borderRadius: '4px',
                  border: '1px solid #FFD700',
                  background: '#fff',
                  color: '#000',
                  fontFamily: 'Cinzel, serif',
                  fontSize: '12px',
                  boxSizing: 'border-box',
                  resize: 'none',
                  height: '100%',
                  minHeight: '60px'
                }}
              />
            </div>
            
            <button
              type="submit"
              style={{
                padding: '0.3rem 0.8rem',
                borderRadius: '6px',
                border: '2px solid #F7D774',
                background: '#F7D774',
                color: '#000',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 8px #F7D700',
                transition: 'background 0.2s, color 0.2s',
                fontFamily: 'Cinzel, serif',
                fontSize: '12px',
                width: '100%',
                flexShrink: 0
              }}
              onMouseOver={e => { e.target.style.background = '#5f4b0aff'; e.target.style.color = '#F7D774'; }}
              onMouseOut={e => { e.target.style.background = '#e6be49ff'; e.target.style.color = '#000000ff'; }}
            >Send</button>
          </form>
        </div>

        {/* Status Message */}
        {status && <p style={{ 
          marginTop: '0.3rem', 
          color: status.includes('success') ? '#4caf50' : '#f44336', 
          textShadow: '0 1px 4px #000', 
          fontFamily: 'Cinzel, serif',
          fontSize: '11px',
          flexShrink: 0
        }}>{status}</p>}
      </div>
    </div>
  );
}

export default ContactFrontDesk;