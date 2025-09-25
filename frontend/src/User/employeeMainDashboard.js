import React, { useState } from 'react';
import { Menu, Home, Calendar, List, CreditCard, User } from 'lucide-react';
import './user.css';

import MobileSidebar from './mobileSidebar';
import EmployeeDashboard from './employeeDashboard';
import EmployeeLogHistory from './employeelogHistory';
import EmployeeTasks from './employeetask';
import EmployeePayroll from './employeePayroll';
import EmployeeProfile from './employeeProfile';
import LogoutModal from './logoutModal'; // 👈 import modal

const EmployeeMainDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [showLogout, setShowLogout] = useState(false); // 👈 modal state

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => setSidebarOpen(true)} className="p-1">
              <Menu className="w-6 h-6 text-gray-800" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
          </div>
        </div>
      </header>

      <MobileSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        setActivePage={setActivePage}
        activePage={activePage}
        onLogout={() => setShowLogout(true)} // 👈 open modal from sidebar
      />

      <main className="pb-20">{renderPage()}</main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-20">
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
              className={`flex flex-col items-center space-y-1 py-2 px-4 rounded-lg transition-colors ${
                activePage === id ? 'text-black font-medium' : 'text-gray-500'
              }`}
              style={{ backgroundColor: activePage === id ? '#F8E8C2' : 'transparent' }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/*  Logout Modal here */}
      <LogoutModal 
        isOpen={showLogout} 
        onConfirm={handleLogout} 
        onCancel={() => setShowLogout(false)} 
      />
    </div>
  );
};

export default EmployeeMainDashboard;
