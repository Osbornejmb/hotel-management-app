import React, { useState, useEffect } from 'react';

const EmployeeLogHistory = () => {
  const [logEntries, setLogEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalHours, setTotalHours] = useState(0);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://hotel-management-app-qo2l.onrender.com';

  const getEmployeeFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
          employeeId: payload.employeeId || '',
        };
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
    return { employeeId: '' };
  };

  useEffect(() => {
    const fetchLogHistory = async () => {
      try {
        setLoading(true);
        const employee = getEmployeeFromToken();
        if (!employee.employeeId) {
          throw new Error('Employee ID not found in token.');
        }

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/attendance/${employee.employeeId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch log history');
        }

        const data = await response.json();
        const formattedData = data.map(entry => ({
          date: new Date(entry.clockIn).toLocaleDateString(),
          timeIn: new Date(entry.clockIn).toLocaleTimeString(),
          timeOut: entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString() : '—',
          totalHours: entry.totalHours ? entry.totalHours.toFixed(2) + ' hrs' : '—',
          status: entry.clockOut ? 'COMPLETED' : 'ACTIVE',
        }));
        setLogEntries(formattedData);

        const total = data.reduce((acc, entry) => acc + (entry.totalHours || 0), 0);
        setTotalHours(total.toFixed(2));

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogHistory();
  }, []);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4">Error: {error}</div>;
  }

  if (logEntries.length === 0) {
    return <div className="p-4 text-center">No Data Yet</div>;
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Log History</h1>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-500">{totalHours}</div>
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
