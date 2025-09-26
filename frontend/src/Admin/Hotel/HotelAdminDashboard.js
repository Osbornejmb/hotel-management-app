
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
        <div className="hotel-admin-dashboard-root">
          {/* Sidebar */}
          <aside className="hotel-admin-dashboard-sidebar">
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
            <nav className="hotel-admin-dashboard-nav">
              {/* Logout button in upper right */}
              <div className="hotel-admin-dashboard-logout-btn">
                <LogoutButton />
              </div>
              {/* Home button in upper left */}
              <div className="hotel-admin-dashboard-home-btn">
                <button
                  onClick={() => navigate('/admin/hotel')}
                  className="hotel-admin-dashboard-home-btn-actual"
                >
                  Home
                </button>
              </div>
              <span className="hotel-admin-dashboard-title">Lumine</span>
              <span className="hotel-admin-dashboard-subtitle">room management</span>
            </nav>
            <div className="hotel-admin-dashboard-content">
              {children}
            </div>
          </div>
        </div>
      );
    }

    export default HotelAdminDashboard;
