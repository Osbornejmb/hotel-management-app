import React from 'react';
import { Calendar, User, Home, List, CreditCard, LogOut, X } from 'lucide-react';
import LogoutButton from '../Auth/LogoutButton';

const MobileSidebar = ({ activePage, setActivePage, isMobile, isOpen, setOpen }) => {
  const navIcons = {
    dashboard: Home,
    logHistory: Calendar,
    tasks: List,
    payroll: CreditCard,
    profile: User,
  };

  const sections = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'logHistory', label: 'Log History' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'payroll', label: 'Payroll' },
    { key: 'profile', label: 'Profile' },
  ];

  const sidebarStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: 220,
    background: '#4b2b17',
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderRight: '1px solid rgba(0,0,0,0.08)',
    color: '#fff',
    height: '100vh',
    overflowY: 'auto',
    zIndex: 1200,
    transition: 'transform 0.3s ease',
    transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
  };

  const backdropStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1199,
    display: isMobile && isOpen ? 'block' : 'none',
  };

  const handleSectionClick = (section) => {
    setActivePage(section);
    if (isMobile) {
      setOpen(false);
    }
  }

  return (
    <>
      <div style={backdropStyle} onClick={() => setOpen(false)}></div>
      <aside style={sidebarStyle}>
        {isMobile && (
          <button onClick={() => setOpen(false)} style={{ position: 'absolute', top: 15, right: 15, color: 'white' }}>
            <X size={24} />
          </button>
        )}
        {/* Profile section */}
        <div
          onClick={() => handleSectionClick('profile')}
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 12,
            padding: 12,
            borderRadius: 8,
            cursor: 'pointer',
            background: activePage === 'profile' ? '#d2aa3a' : 'transparent',
            color: activePage === 'profile' ? '#2f1b0a' : '#fff',
            fontWeight: activePage === 'profile' ? 600 : 400,
            transition: 'background 140ms ease'
          }}
        >
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#a57c2b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 24,
            marginBottom: 8
          }}>
            <User size={32} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 16, marginTop: 4 }}>
            {localStorage.getItem('name') || localStorage.getItem('username') || 'Employee'}
          </div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            {localStorage.getItem('role') || 'Employee'}
          </div>
        </div>

        {/* Sidebar buttons */}
        <nav style={{ width: '100%' }}>
          {sections.map(sec => {
            const Icon = navIcons[sec.key] || '•';
            return (
              <button
                key={sec.key}
                className={`sidebar-btn ${activePage === sec.key ? 'active' : ''}`}
                onClick={() => handleSectionClick(sec.key)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  marginBottom: 12,
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 500,
                  color: '#fff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  background: activePage === sec.key ? '#a57c2b' : '#4b2b17',
                  transition: 'background 140ms ease'
                }}
              >
                <Icon size={18} style={{ marginRight: 12 }} />
                {sec.label}
              </button>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ width: '100%' }}>
          <LogoutButton
            style={{
              width: '100%',
              background: 'linear-gradient(90deg, #f2d49b, #dabf84)',
              color: '#4b3a2b',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #dabf84, #f2d49b)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #f2d49b, #dabf84)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <LogOut size={18} style={{ marginRight: 12 }}/>
            Logout
          </LogoutButton>
        </div>
      </aside>
    </>
  );
};

export default MobileSidebar;
