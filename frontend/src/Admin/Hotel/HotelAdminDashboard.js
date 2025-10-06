import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTachometerAlt, FaBed, FaBroom, FaTools, FaHistory, FaBell } from 'react-icons/fa';
import LogoutButton from '../../Auth/LogoutButton';
import './HotelAdminDashboard.css';

// This is now the master layout (HotelAdminLayout)

function HotelAdminDashboard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Notification state
  const [notification, setNotification] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const prevStatusesRef = useRef([]);

  useEffect(() => {
    let intervalId;
    const fetchBookings = async () => {
      try {
        const res = await fetch('/api/bookings');
        if (!res.ok) return;
        const data = await res.json();
        // Compare statuses only
        const prevStatuses = prevStatusesRef.current;
        const newStatuses = data.map(b => ({ id: b._id, status: b.status }));
        if (prevStatuses.length > 0) {
          for (let i = 0; i < newStatuses.length; i++) {
            const prev = prevStatuses.find(p => p.id === newStatuses[i].id);
            if (prev && prev.status !== newStatuses[i].status) {
              const booking = data.find(b => b._id === newStatuses[i].id);
              const roomNumber = booking ? booking.roomNumber : newStatuses[i].id;
              setNotification(`Room number ${roomNumber} status changed: ${prev.status} → ${newStatuses[i].status}`);
              setShowNotification(true);
              break;
            }
          }
        }
        prevStatusesRef.current = newStatuses;
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchBookings();
    intervalId = setInterval(fetchBookings, 20000);
    return () => clearInterval(intervalId);
  }, []);

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
          <span
            className="hotel-admin-dashboard-notification-icon"
            title="Notifications"
            style={{ marginRight: '1.2rem', fontSize: '1.5rem', verticalAlign: 'middle', cursor: 'pointer', color: '#fff', position: 'relative' }}
            onClick={() => setShowNotification(!showNotification)}
          >
            <FaBell />
            {notification && showNotification && (
              <div className="hotel-admin-dashboard-notification-popup">
                <button
                  className="hotel-admin-dashboard-notification-close"
                  aria-label="Dismiss notification"
                  onClick={() => { setNotification(null); setShowNotification(false); }}
                >&#10005;</button>
                <span className="hotel-admin-dashboard-notification-text">{notification}</span>
              </div>
            )}
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

export default HotelAdminDashboard;