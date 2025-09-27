
    import React from 'react';
    import { useNavigate, useLocation } from 'react-router-dom';
    import LogoutButton from '../../Auth/LogoutButton';
    import './HotelAdminDashboard.css';

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
        <div className="hotel-admin-dashboard-root gold-theme">
          {/* Top navbar full width */}
          <nav className="hotel-admin-dashboard-nav gold-theme" style={{width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: 100}}>
            {/* Home icon */}
            <div className="hotel-admin-dashboard-home-btn">
              <button
                onClick={() => navigate('/admin/hotel')}
                className="hotel-admin-dashboard-home-btn-actual"
                title="Home"
                style={{ fontSize: '1.5rem', background: 'none', border: 'none', color: '#fff' }}
              >
                <span role="img" aria-label="home">🏠</span>
              </button>
            </div>
            {/* Title and subtitle */}
            <span className="hotel-admin-dashboard-title gold-theme">Lumine</span>
            <span className="hotel-admin-dashboard-subtitle gold-theme">Room Management</span>
            {/* Logout button in upper right */}
            <div className="hotel-admin-dashboard-logout-btn">
              <LogoutButton />
            </div>
          </nav>
          {/* Sidebar below navbar */}
          <div style={{display: 'flex', width: '100vw', marginTop: '110px'}}>
            <aside className="hotel-admin-dashboard-sidebar gold-theme">
              {sidebarButtons.map(btn => (
                <button
                  key={btn.name}
                  className={`hotel-admin-dashboard-sidebar-btn${location.pathname === btn.path ? ' selected' : ''}`}
                  onClick={() => navigate(btn.path)}
                >
                  {btn.name}
                </button>
              ))}
            </aside>
            {/* Main content area */}
            <div className="hotel-admin-dashboard-main">
              <div className="hotel-admin-dashboard-content gold-theme">
                {children}
              </div>
            </div>
          </div>
        </div>
      );
    }

    export default HotelAdminDashboard;
