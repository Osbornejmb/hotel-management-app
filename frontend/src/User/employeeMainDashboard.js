import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import './user.css';

import EmployeeDashboard from './employeeDashboard';
import EmployeeLogHistory from './employeelogHistory';
import EmployeeTasks from './employeetask';
import EmployeePayroll from './employeePayroll';
import EmployeeProfile from './employeeProfile';
import LogoutModal from './logoutModal'; // 👈 import modal
import MobileSidebar from './mobileSidebar';
import useResponsive from '../hooks/useResponsive';

const EmployeeMainDashboard = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [showLogout, setShowLogout] = useState(false);
  const { isMobile } = useResponsive();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <EmployeeDashboard />;
      case 'logHistory': return <EmployeeLogHistory />;
      case 'tasks': return <EmployeeTasks />;
      case 'payroll': return <EmployeePayroll />;
      case 'profile': return <EmployeeProfile />;
      default: return <EmployeeDashboard />;
    }
  };

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Employee Portal';
      case 'logHistory': return 'Log History';
      case 'tasks': return 'Tasks';
      case 'payroll': return 'Payroll';
      case 'profile': return 'Profile';
      default: return 'Employee Portal';
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const mainStyle = {
    flex: 1,
    padding: isMobile ? 20 : 40,
    position: 'relative',
    marginLeft: isMobile ? 0 : 220,
    transition: 'margin-left 0.3s ease'
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <MobileSidebar activePage={activePage} setActivePage={setActivePage} isMobile={isMobile} isOpen={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div style={mainStyle}>
        {isMobile && (
          <button onClick={() => setSidebarOpen(true)} style={{ position: 'absolute', top: 15, left: 15, zIndex: 1100 }}>
            <Menu size={24} />
          </button>
        )}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4 sticky top-0 z-30">
          <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
        </header>

        <main className="pb-20">{renderPage()}</main>
      </div>

      <LogoutModal 
        isOpen={showLogout} 
        onConfirm={handleLogout} 
        onCancel={() => setShowLogout(false)} 
      />
    </div>
  );
};

export default EmployeeMainDashboard;
