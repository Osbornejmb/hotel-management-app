import React, { useState } from 'react';
import { Home, Calendar, List, CreditCard, User } from 'lucide-react';
import './user.css';

import EmployeeDashboard from './employeeDashboard';
import EmployeeLogHistory from './employeelogHistory';
import EmployeeTasks from './employeetask';
import EmployeePayroll from './employeePayroll';
import EmployeeProfile from './employeeProfile';
import LogoutModal from './logoutModal';

// 1. Import notification components
import NotificationBell from '../Admin/Employee/components/NotificationBell';
import NotificationBar from '../Admin/Employee/components/notificationbar';

const EmployeeMainDashboard = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [showLogout, setShowLogout] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:h-screen lg:fixed lg:top-0 lg:left-0 bg-[#4b2b17] shadow-sm z-20 text-white" style={{ padding: '24px', width: '220px' }}>
        {/* ... sidebar content remains the same ... */}
        <div className="p-4 font-bold text-lg">Employee Portal</div>
        <nav className="mt-6 flex flex-col space-y-2 flex-grow">
          {[
            { id: 'dashboard', label: 'Home', icon: Home },
            { id: 'logHistory', label: 'Log', icon: Calendar },
            { id: 'tasks', label: 'Tasks', icon: List },
            { id: 'payroll', label: 'Payroll', icon: CreditCard },
            { id: 'profile', label: 'Profile', icon: User }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              className={`flex items-center space-x-3 px-4 py-2 rounded-md text-left transition-colors duration-200 ${activePage === id
                  ? 'bg-[#d2aa3a] text-[#2f1b0a] font-semibold'
                  : 'text-white hover:bg-[rgba(255,255,255,0.1)]'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          ))}
          <button
            onClick={() => setShowLogout(true)}
            className="flex items-center space-x-3 px-4 py-2 rounded-md text-left text-red-400 hover:bg-[rgba(255,255,255,0.1)] mt-auto"
          >
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* 2. Updated header with NotificationBell */}
        <header className="flex justify-between items-center bg-white shadow-sm border-b border-gray-200 px-4 py-4 sticky top-0 z-30">
          <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
          <div>
            <NotificationBell />
          </div>
        </header>

        {/* 3. Updated main area with NotificationBar */}
        <main className="p-6 pb-20">
          <div className="mb-6 rounded-lg overflow-hidden shadow-md">
            <NotificationBar />
          </div>
          
          <div>
            {renderPage()}
          </div>
        </main>
      </div>

      {/* Bottom Navigation - Mobile only */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#4b2b17] border-t border-gray-800 px-4 py-2 z-20 lg:hidden">
        {/* ... bottom navigation remains the same ... */}
        <div className="flex justify-around">
          {[
            { id: 'dashboard', label: 'Home', icon: Home },
            { id: 'logHistory', label: 'Log', icon: Calendar },
            { id: 'tasks', label: 'Tasks', icon: List },
            { id: 'payroll', label: 'Payroll', icon: CreditCard },
            { id: 'profile', label: 'Profile', icon: User }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              className={`flex flex-col items-center space-y-1 py-2 px-4 rounded-lg transition-colors ${activePage === id
                  ? 'bg-[#d2aa3a] text-[#2f1b0a] font-semibold'
                  : 'text-white hover:bg-[rgba(255,255,255,0.1)]'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogout}
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
      />
    </div>
  );
};

export default EmployeeMainDashboard;