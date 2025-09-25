import React from 'react';
import { Calendar, User, Home, List, CreditCard, LogOut } from 'lucide-react';

const MobileSidebar = ({ isOpen, onClose, setActivePage, activePage }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'logHistory', label: 'Log History', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: List },
    { id: 'payroll', label: 'Payroll', icon: CreditCard },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      
      <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
              D
            </div>
            <div>
              <div className="font-semibold text-gray-900">Dostoyevsky</div>
              <div className="text-sm text-gray-500">Employee</div>
            </div>
          </div>
        </div>

        <nav className="py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  onClose();
                }}
                className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                  activePage === item.id 
                    ? 'text-black font-medium' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                style={{
                  backgroundColor: activePage === item.id ? '#F8E8C2' : 'transparent'
                }}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-0 right-0 px-6">
          <button className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;
