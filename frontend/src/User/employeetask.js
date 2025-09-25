import React from 'react';

const EmployeeTasks = () => {
  const tasks = [
    { id: 1, title: 'Clean Lobby', description: 'Deep cleaning of main lobby', dueDate: '2025-01-10', status: 'Pending' },
    { id: 2, title: 'Fix Aircon', description: 'Repair AC in Room 302', dueDate: '2025-01-12', status: 'In Progress' },
    { id: 3, title: 'Change Bedsheets', description: 'Room 205 and 206 bedsheets replacement', dueDate: '2025-01-14', status: 'Completed' }
  ];

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Tasks</h1>
      <div className="space-y-3">
        {tasks.map(task => (
          <div key={task.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-gray-900">{task.title}</h2>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                task.status === 'Completed'
                  ? 'bg-green-100 text-green-800'
                  : task.status === 'In Progress'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {task.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
            <div className="text-xs text-gray-500">Due: {task.dueDate}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeTasks;
