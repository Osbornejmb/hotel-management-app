import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTachometerAlt, FaBed, FaBroom, FaTools, FaHistory, FaBell } from 'react-icons/fa';
import LogoutButton from '../../Auth/LogoutButton';
import './HotelAdminDashboard.css';

// This is now the master layout (HotelAdminLayout)

function HotelAdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const sidebarButtons = [
    { name: 'Dashboard', path: '/admin/hotel', icon: <FaTachometerAlt /> },
    { name: 'Rooms', path: '/admin/hotel/rooms', icon: <FaBed /> },
    { name: 'Housekeeping', path: '/admin/hotel/housekeeping', icon: <FaBroom /> },
    { name: 'Maintenance', path: '/admin/hotel/maintenance', icon: <FaTools /> },
    { name: 'Booking History', path: '/admin/hotel/booking-history', icon: <FaHistory /> },
  ];

  return (
    <div className="hotel-admin-dashboard-root gold-theme">
      {/* Top navbar */}
      <nav className="hotel-admin-dashboard-nav gold-theme">
        <div className="hotel-admin-dashboard-home-btn">
          <button
            onClick={() => navigate('/admin/hotel')}
            className="hotel-admin-dashboard-home-btn-actual"
            title="Home"
            style={{
              fontSize: '1.5rem',
              background: 'none',
              border: 'none',
              color: '#fff',
            }}
          >
            <img src="/home_icon.png" alt="Home" className="hotel-admin-dashboard-home-icon" />
          </button>
        </div>

        <img src="/lumine_logo.png" alt="Lumine Logo" className="hotel-admin-dashboard-logo" />

        <div className="hotel-admin-dashboard-logout-btn">
          <span className="hotel-admin-dashboard-notification-icon" title="Notifications" style={{ marginRight: '1.2rem', fontSize: '1.5rem', verticalAlign: 'middle', cursor: 'pointer', color: '#fff' }}>
            <FaBell />
          </span>
          <LogoutButton />
        </div>
      </nav>

      {/* Sidebar */}
      <div style={{ display: 'flex', width: '100vw' }}>
        <aside className="hotel-admin-dashboard-sidebar gold-theme">
          {sidebarButtons.map((btn) => (
            <button
              key={btn.name}
              className={`hotel-admin-dashboard-sidebar-btn${
                location.pathname === btn.path ? ' selected' : ''
              }`}
              onClick={() => navigate(btn.path)}
            >
              <span className="sidebar-icon">{btn.icon}</span>
              <span className="sidebar-text">{btn.name}</span>
            </button>
          ))}
        </aside>

        {/* Main content */}
        <div className="hotel-admin-dashboard-main">
          <div className="hotel-admin-dashboard-content gold-theme">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default HotelAdminLayout;