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

function EmployeeAdminDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f7f7' }}>
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <main style={{ flex: 1, padding: 40, position: 'relative' }}>
        {/* Notification Bell positioned at top right */}
        <div style={{
          position: 'absolute',
          top: 20,
          right: 40,
          zIndex: 1000
        }}>
          <NotificationBell />
        </div>
        
        {/* Main content with top padding to avoid overlap */}
        <div style={{ paddingTop: 60 }}>
          {renderSection()}
        </div>
      </main>
    </div>
  );
}

export default EmployeeAdminDashboard;