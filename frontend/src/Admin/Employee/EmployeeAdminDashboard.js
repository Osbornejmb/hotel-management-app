import React, { useState } from 'react';
import Sidebar from './components/sidebarAdmin'; 
import DashboardSection from './Dashboard/dashboardSection';
import EmployeeManagementSection from './Dashboard/employeeManagementSection';
import AttendanceSection from './Dashboard/attendanceSection';
import PayrollSection from './Dashboard/payrollSection';
import TasksSection from './Dashboard/taskSection';
import RoomAssignmentSection from './Dashboard/roomAssignmentSection';
import ProfileSection from './Dashboard/profileSection';


function EmployeeAdminDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardSection />;
      case 'employee': return <EmployeeManagementSection />;
      case 'attendance': return <AttendanceSection />;
      case 'payroll': return <PayrollSection />;
      case 'tasks': return <TasksSection />;
      case 'room': return <RoomAssignmentSection />;
      case 'profile': return <ProfileSection />;
      default: return <DashboardSection />;
}
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f7f7' }}>
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <main style={{ flex: 1, padding: 40 }}>
        {renderSection()}
      </main>
    </div>
  );
}

export default EmployeeAdminDashboard;