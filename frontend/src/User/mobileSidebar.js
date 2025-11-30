import React, { useState } from "react";
import { Calendar, User, Home, List, CreditCard, LogOut } from "lucide-react";

const DesktopSidebar = ({ activePage, setActivePage }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "logHistory", label: "Log History", icon: Calendar },
    { id: "tasks", label: "Tasks", icon: List },
    { id: "payroll", label: "Payroll", icon: CreditCard },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-30 transition-all duration-300
      ${isCollapsed ? "w-20" : "w-64"} flex flex-col text-white`}
      style={{ backgroundColor: "#4b2b17" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && <h2 className="text-lg font-bold">Menu</h2>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded hover:bg-[rgba(255,255,255,0.1)]"
        >
          {isCollapsed ? "➡️" : "⬅️"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 flex-1 px-2">
        {menuItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActivePage(id)}
            className={`flex items-center w-full rounded-lg text-left transition-colors duration-200
              ${
                activePage === id
                  ? "bg-[#d2aa3a] text-[#2f1b0a] font-semibold"
                  : "text-white hover:bg-[rgba(255,255,255,0.1)]"
              }`}
            style={{ padding: '10px 12px' }}
          >
            <Icon className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">{label}</span>}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="mt-auto p-4">
        <button
          className="flex items-center w-full rounded-lg transition-colors"
          style={{ color: "#dabf84", padding: '10px 12px' }}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="ml-3">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
