import React from 'react';

const EmployeeLogHistory = () => {
  const logEntries = [
    { date: '2025-01-05', timeIn: '05:00 AM', timeOut: '—', totalHours: '—', status: 'ACTIVE' },
    { date: '2025-01-04', timeIn: '05:00 AM', timeOut: '05:00 PM', totalHours: '12 hrs', status: 'COMPLETED' }
  ];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Log History</h1>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-500">18:50</div>
          <div className="text-xs text-gray-500">Total Hours</div>
        </div>
      </div>

      <div className="space-y-3">
        {logEntries.map((entry, index) => (
          <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium text-gray-900">{entry.date}</div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                entry.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {entry.status}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><div className="text-gray-500 text-xs">Time In</div><div className="font-medium">{entry.timeIn}</div></div>
              <div><div className="text-gray-500 text-xs">Time Out</div><div className="font-medium">{entry.timeOut}</div></div>
              <div><div className="text-gray-500 text-xs">Total Hours</div><div className="font-medium">{entry.totalHours}</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeLogHistory;
