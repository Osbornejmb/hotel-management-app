
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LogoutButton from '../../Auth/LogoutButton';

function HotelAdminDashboard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarButtons = [
    { name: 'Dashboard', path: '/admin/hotel' },
    { name: 'Rooms', path: '/admin/hotel/rooms' },
    { name: 'Housekeeping', path: '/admin/hotel/housekeeping' },
    { name: 'Maintenance', path: '/admin/hotel/maintenance' },
    { name: 'Booking history', path: '/admin/hotel/booking-history' },
  ];
  return (
    <div style={{ background: '#111', minHeight: '100px', color: '#FFD700', paddingBottom: '2rem', display: 'flex', width: "100vm", overflowX: "hidden" }}>
      {/* Sidebar */}
      <aside style={{ width: '220px', background: '#181818', minHeight: '100vh', boxShadow: '2px 0 8px #FFD700', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '2.5rem' }}>
        {sidebarButtons.map(btn => (
          <button
            key={btn.name}
            onClick={() => navigate(btn.path)}
            style={{
              width: '170px',
              margin: '0.5rem 0',
              padding: '0.8rem 0',
              borderRadius: '8px',
              border: location.pathname === btn.path ? '2px solid #FFD700' : '2px solid #333',
              background: location.pathname === btn.path ? '#FFD700' : '#222',
              color: location.pathname === btn.path ? '#222' : '#FFD700',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              cursor: 'pointer',
              boxShadow: location.pathname === btn.path ? '0 2px 8px #FFD700' : 'none',
              letterSpacing: '1px',
              transition: 'background 0.2s, color 0.2s',
            }}
            onMouseOver={e => {
              if (location.pathname !== btn.path) {
                e.target.style.background = '#FFD700';
                e.target.style.color = '#222';
              }
            }}
            onMouseOut={e => {
              if (location.pathname !== btn.path) {
                e.target.style.background = '#222';
                e.target.style.color = '#FFD700';
              }
            }}
          >
            {btn.name}
          </button>
        ))}
      </aside>
      {/* Main content area */}
      <div style={{ flex: 1 }}>
        <nav
          style={{
            width: '100%',
            background: '#222',
            padding: '1.5rem 0 2.5rem 0',
            position: 'relative',
            boxShadow: '0 2px 8px #FFD700',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Logout button in upper right */}
          <div style={{ position: 'absolute', top: '1.2rem', right: '2rem' }}>
            <LogoutButton />
          </div>
          {/* Home button in upper left */}
          <div style={{ position: 'absolute', top: '1.2rem', left: '2rem' }}>
            <button
              onClick={() => navigate('/admin/hotel')}
              style={{
                background: '#FFD700',
                color: '#222',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1.2rem',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px #FFD700',
                letterSpacing: '1px',
                transition: 'background 0.2s, color 0.2s',
              }}
              onMouseOver={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}
              onMouseOut={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
            >
              Home
            </button>
          </div>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', letterSpacing: '4px', color: '#FFD700', textShadow: '0 2px 8px #000' }}>Lumine</span>
          <span style={{ fontSize: '1rem', color: '#FFD700', opacity: 0.8, marginTop: '0.3rem', letterSpacing: '2px' }}>room management</span>
        </nav>
        <div style={{ padding: '2rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default HotelAdminDashboard;
