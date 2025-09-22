import React from 'react';
import LogoutButton from '../../../Auth/LogoutButton';

const SidebarAdmin = ({ activeSection, setActiveSection }) => {
  const navIcons = {
    dashboard: '🏠',
    employee: '👥',
    attendance: '📅',
    payroll: '💳',
    tasks: '🧾',
    room: '🛏️',
    profile: '👤'
  };

  const sections = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'employee', label: 'Employees' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'payroll', label: 'Payroll' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'room', label: 'Room Assignment' },
  ];

  return (
    <aside style={{
      width: 220,
      background: '#4b2b17',
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      borderRight: '1px solid rgba(0,0,0,0.08)',
      position: 'relative',
      color: '#fff',
      minHeight: '100vh'
    }}>
      {/* Profile section */}
      <div
        onClick={() => setActiveSection('profile')}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 12,
          padding: 12,
          borderRadius: 8,
          cursor: 'pointer',
          background: activeSection === 'profile' ? '#d2aa3a' : 'transparent',
          color: activeSection === 'profile' ? '#2f1b0a' : '#fff',
          fontWeight: activeSection === 'profile' ? 600 : 400,
          transition: 'background 140ms ease'
        }}
      >
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: activeSection === 'profile' ? '#2f1b0a' : '#2f1b0a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 24,
          marginBottom: 8
        }}>
          <span style={{ opacity: 0.95 }}>◯</span>
        </div>
        <div style={{ fontWeight: 700, fontSize: 16, marginTop: 4 }}>
          {localStorage.getItem('name') || localStorage.getItem('username') || 'Admin'}
        </div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          {localStorage.getItem('role') || 'Admin'}
        </div>
      </div>

      {/* Sidebar buttons */}
      <style>{`
        .sidebar-btn {
          width: 100%;
          padding: 10px 12px;
          margin-bottom: 12px;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          color: #fff;
          text-align: left;
          cursor: pointer;
          background: #4b2b17;
          display: flex;
          align-items: center;
          transition: background 140ms ease;
        }
        .sidebar-btn:hover {
          background: rgba(255,255,255,0.1);
        }
        .sidebar-btn.active {
          background: #d2aa3a !important;
          color: #2f1b0a !important;
          font-weight: 600;
          box-shadow: none;
        }
      `}</style>

      <nav style={{ width: '100%' }}>
        {sections.map(sec => (
          <button
            key={sec.key}
            className={`sidebar-btn ${activeSection === sec.key ? 'active' : ''}`}
            onClick={() => setActiveSection(sec.key)}
          >
            <span style={{ marginRight: 12, fontSize: 18 }}>
              {navIcons[sec.key] || '•'}
            </span>
            {sec.label}
          </button>
        ))}
      </nav>

      {/* Logout button */}
      <div style={{
        position: 'absolute',
        left: 24,
        bottom: 24,
        width: 'calc(100% - 48px)'
      }}>
        <LogoutButton style={{
          width: '100%',
          background: 'transparent',
          color: '#dabf84',
          border: 'none',
          textAlign: 'left',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer'
        }} />
      </div>
    </aside>
  );
};

export default SidebarAdmin;
