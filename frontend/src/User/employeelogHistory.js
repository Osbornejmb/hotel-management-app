import React, { useState, useEffect } from 'react';

const EmployeeLogHistory = () => {
  const [logEntries, setLogEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalHours, setTotalHours] = useState(0);
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' or 'tasks'

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://hotel-management-app-qo2l.onrender.com';

  const getEmployeeFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
          employeeId: payload.employeeId || '',
          name: payload.name || '',
          id: payload.id || ''
        };
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
    return { employeeId: '', name: '', id: '' };
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
        
        // Fetch both attendance and completed tasks
        const [attendanceRes, tasksRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/attendance/${employee.employeeId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/api/tasks`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
        ]);

        // Handle attendance data
        let attendanceData = [];
        if (attendanceRes.ok) {
          const data = await attendanceRes.json();
          if (Array.isArray(data) && data.length > 0) {
            attendanceData = data.map(entry => ({
              date: entry.clockIn ? new Date(entry.clockIn).toLocaleDateString() : 'Unknown',
              timeIn: entry.clockIn ? new Date(entry.clockIn).toLocaleTimeString() : '—',
              timeOut: entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString() : '—',
              totalHours: entry.totalHours ? entry.totalHours.toFixed(2) + ' hrs' : '—',
              status: entry.clockOut ? 'COMPLETED' : 'ACTIVE',
              type: 'attendance'
            }));
          }
        }

        // Handle completed tasks data
        let completedTasks = [];
        if (tasksRes.ok) {
          const allTasks = await tasksRes.json();
          const myCompletedTasks = allTasks.filter(task => {
            const matchesName = task.assigned && 
                               task.assigned.toLowerCase() === employee.name.toLowerCase();
            const matchesId = task.employeeId && 
                             task.employeeId.toString() === employee.employeeId?.toString();
            const isCompleted = task.status === 'COMPLETED';
            return (matchesName || matchesId) && isCompleted;
          });
          
          completedTasks = myCompletedTasks.map(task => {
            // Log the entire task object to see all fields
            console.log('Full Completed Task Object:', JSON.stringify(task, null, 2));
            
            // Try different date fields with better error handling
            let completionDate = 'Unknown';
            
            try {
              if (task.completedAt && task.completedAt !== null && task.completedAt !== undefined) {
                const date = new Date(task.completedAt);
                if (!isNaN(date.getTime())) {
                  completionDate = date.toLocaleDateString();
                }
              } else if (task.updatedAt && task.updatedAt !== null && task.updatedAt !== undefined) {
                const date = new Date(task.updatedAt);
                if (!isNaN(date.getTime())) {
                  completionDate = date.toLocaleDateString();
                }
              } else if (task.date && task.date !== null && task.date !== undefined) {
                const date = new Date(task.date);
                if (!isNaN(date.getTime())) {
                  completionDate = date.toLocaleDateString();
                }
              } else if (task.createdAt && task.createdAt !== null && task.createdAt !== undefined) {
                const date = new Date(task.createdAt);
                if (!isNaN(date.getTime())) {
                  completionDate = date.toLocaleDateString();
                }
              }
            } catch (err) {
              console.error('Error parsing date for task:', task._id, err);
            }
            
            console.log('Parsed Completion Date:', completionDate, 'for task:', task._id);
            
            return {
              date: completionDate,
              taskName: task.type || task.jobType || task.taskType || 'Task',
              roomNumber: task.room || task.roomNumber || 'N/A',
              priority: task.priority || 'LOW',
              status: 'COMPLETED',
              type: 'task'
            };
          });
        }

        setLogEntries([...attendanceData, ...completedTasks]);

        const total = attendanceData.reduce((acc, entry) => {
          const hours = parseFloat(entry.totalHours);
          return acc + (isNaN(hours) ? 0 : hours);
        }, 0);
        
        setTotalHours(total.toFixed(2));
        setError(null);

      } catch (err) {
        console.error('Error fetching log history:', err);
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

  const attendanceEntries = logEntries.filter(entry => entry.type === 'attendance');
  const taskEntries = logEntries.filter(entry => entry.type === 'task');

  if (logEntries.length === 0) {
    return <div className="p-4 text-center">No Data Yet</div>;
  }

  return (
    <div className="p-4">
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button 
            onClick={() => setActiveTab('attendance')}
            style={{
              padding: '8px 16px',
              background: activeTab === 'attendance' ? '#007bff' : '#f0f0f0',
              color: activeTab === 'attendance' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: activeTab === 'attendance' ? 'bold' : 'normal'
            }}
          >
            Attendance ({attendanceEntries.length})
          </button>
          <button 
            onClick={() => setActiveTab('tasks')}
            style={{
              padding: '8px 16px',
              background: activeTab === 'tasks' ? '#007bff' : '#f0f0f0',
              color: activeTab === 'tasks' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: activeTab === 'tasks' ? 'bold' : 'normal'
            }}
          >
            Completed Tasks ({taskEntries.length})
          </button>
        </div>
      </div>

      {activeTab === 'attendance' && (
        <div>
          <h3>Attendance Records</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Time In</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Time Out</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Total Hours</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceEntries.map((entry, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{entry.date}</td>
                  <td style={{ padding: '10px' }}>{entry.timeIn}</td>
                  <td style={{ padding: '10px' }}>{entry.timeOut}</td>
                  <td style={{ padding: '10px' }}>{entry.totalHours}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      background: entry.status === 'COMPLETED' ? '#d4edda' : '#fff3cd',
                      color: entry.status === 'COMPLETED' ? '#155724' : '#856404',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.85rem'
                    }}>
                      {entry.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '15px', fontSize: '1.1rem', fontWeight: 'bold' }}>
            Total Hours Worked: {totalHours} hrs
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div>
          <h3>Completed Tasks</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date Completed</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Task Type</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Room #</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Priority</th>
              </tr>
            </thead>
            <tbody>
              {taskEntries.map((entry, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{entry.date}</td>
                  <td style={{ padding: '10px' }}>{entry.taskName}</td>
                  <td style={{ padding: '10px' }}>#{entry.roomNumber}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      background: entry.priority === 'HIGH' ? '#f8d7da' : entry.priority === 'MEDIUM' ? '#fff3cd' : '#d1ecf1',
                      color: entry.priority === 'HIGH' ? '#721c24' : entry.priority === 'MEDIUM' ? '#856404' : '#0c5460',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.85rem'
                    }}>
                      {entry.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeLogHistory;
