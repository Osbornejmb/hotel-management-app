import React, { useState } from 'react';
import Sidebar from './components/sidebarAdmin';
import DashboardSection from './Dashboard/dashboardSection';
import EmployeeManagementSection from './Dashboard/employeeManagementSection';
import AttendanceSection from './Dashboard/attendanceSection';
import PayrollSection from './Dashboard/payrollSection';
import TasksSection from './Dashboard/taskSection';
import ProfileSection from './Dashboard/profileSection';
import TaskRequests from './Dashboard/taskRequest';
import NotificationBell from './components/NotificationBell';
import NotificationBar from './components/notificationbar';
import useResponsive from '../../hooks/useResponsive';
import { Menu } from 'lucide-react';

function EmployeeAdminDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const { isMobile } = useResponsive();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardSection />;
      case 'employee': return <EmployeeManagementSection />;
      case 'attendance': return <AttendanceSection />;
      case 'payroll': return <PayrollSection />;
      case 'tasks': return <TasksSection />;
      case 'task-requests': return <TaskRequests/>;
      case 'profile': return <ProfileSection />;
      default: return <DashboardSection />;
    }
  };

  const mainStyle = {
    flex: 1,
    padding: isMobile ? 20 : 40,
    position: 'relative',
    marginLeft: isMobile ? 0 : 220,
    transition: 'margin-left 0.3s ease'
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f7f7' }}>
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} isMobile={isMobile} isOpen={sidebarOpen} setOpen={setSidebarOpen} />
      <main style={mainStyle}>
        {isMobile && (
          <button onClick={() => setSidebarOpen(true)} style={{ position: 'absolute', top: 15, left: 15, zIndex: 1100 }}>
            <Menu size={24} />
          </button>
        )}
        {/* Notification Bell positioned at top right */}
        <div style={{
          position: 'absolute',
          top: 20,
          right: isMobile ? 20 : 40,
          zIndex: 1000
        }}>
          <NotificationBell />
        </div>
        
        {/* Notification Bar in main content area */}
        <div style={{ 
          marginTop: isMobile? 40 : 0,
          marginBottom: 30,
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <NotificationBar />
        </div>
        
        {/* Main content */}
        <div>
          {renderSection()}
        </div>
      </main>
    </div>
  );
}

export default EmployeeAdminDashboard;