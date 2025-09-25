import React from 'react';

const EmployeeDashboard = () => {
  const stats = [
    { value: "5.30", unit: "Hrs", label: "Total Hours", color: "text-orange-500" },
    { value: "5", label: "Tasks Completed", color: "text-green-500" },
    { value: "5", label: "Pending Tasks", color: "text-red-500" }
  ];

  const tasks = [
    { title: "Room Deep Cleaning - Room 505", assignedDate: "December 5,", assignedTime: "1:45 PM", assignee: "Vivian Tabassamy", status: "In Progress", type: "Room Service" },
    { title: "Aircon Cleaning - Room 505", assignedDate: "December 5,", assignedTime: "1:45 PM", assignee: "Vivian Tabassamy", status: "In Progress", type: "Maintenance" }
  ];

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-sm font-medium text-orange-500 mb-4 uppercase tracking-wider">TODAY'S...</h2>
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex items-baseline space-x-1 mb-2">
                <span className={`${index === 0 ? 'text-3xl' : 'text-2xl'} font-bold ${stat.color}`}>
                  {stat.value}
                </span>
                {stat.unit && <span className={`text-sm ${stat.color}`}>{stat.unit}</span>}
              </div>
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        {tasks.map((task, index) => (
          <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-3">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-base mb-1">{task.title}</h3>
                <div className="text-xs text-gray-500 mb-1">
                  <span>Assigned: {task.assignedDate} {task.assignedTime}</span>
                </div>
                <div className="text-xs text-gray-500">
                  <span>Assigned to: {task.assignee}</span>
                </div>
              </div>
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium ml-4 whitespace-nowrap">
                {task.status}
              </span>
            </div>
            {task.type && <div className="text-xs font-medium text-gray-600">{task.type}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
