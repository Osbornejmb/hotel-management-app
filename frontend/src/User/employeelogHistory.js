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
        
        // Fetch employee details to get cardId
        let cardId = null;
        try {
          const employeeRes = await fetch(`${API_BASE_URL}/api/employee/${employee.employeeId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (employeeRes.ok) {
            const employeeData = await employeeRes.json();
            cardId = employeeData.cardId;
            console.log('Employee cardId:', cardId);
          }
        } catch (err) {
          console.error('Error fetching employee details:', err);
        }
        
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

        // Handle attendance data - filter by cardId if available
        let attendanceData = [];
        if (attendanceRes.ok) {
          const data = await attendanceRes.json();
          if (Array.isArray(data) && data.length > 0) {
            // Filter by cardId to ensure we only get this employee's records
            const filteredData = cardId 
              ? data.filter(entry => entry.cardId === cardId)
              : data;
            
            attendanceData = filteredData.map(entry => ({
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
          <h3 style={{ 
            marginBottom: 24, 
            color: '#2c3e50',
            fontWeight: 600,
            fontSize: '1.3rem'
          }}>
            Attendance Records {attendanceEntries.length > 0 && `(${attendanceEntries.length} records)`}
          </h3>
          
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
            marginBottom: 24,
            width: '100%',
            overflowX: 'auto'
          }}>
            <table style={{ 
              width: '100%', 
              fontSize: 14, 
              color: '#2c3e50', 
              borderCollapse: 'collapse',
              minWidth: '600px'
            }}>
              <thead>
                <tr style={{ 
                  textAlign: 'left', 
                  fontWeight: 600,
                  borderBottom: '2px solid #ecf0f1'
                }}>
                  <th style={{ padding: '16px 12px' }}>Date</th>
                  <th style={{ padding: '16px 12px' }}>Time-In</th>
                  <th style={{ padding: '16px 12px' }}>Time-Out</th>
                  <th style={{ padding: '16px 12px' }}>Hours</th>
                  <th style={{ padding: '16px 12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceEntries.map((entry, idx) => (
                  <tr key={idx} style={{ 
                    borderBottom: '1px solid #ecf0f1',
                    transition: 'background 0.2s ease'
                  }}>
                    <td style={{ padding: '16px 12px', fontWeight: 500 }}>{entry.date}</td>
                    <td style={{ padding: '16px 12px', fontWeight: 500 }}>{entry.timeIn}</td>
                    <td style={{ padding: '16px 12px', fontWeight: 500 }}>{entry.timeOut}</td>
                    <td style={{ padding: '16px 12px', fontWeight: 600, color: '#3498db' }}>{entry.totalHours}</td>
                    <td style={{ padding: '16px 12px' }}>
                      <span style={{
                        color: entry.status === 'ACTIVE' ? '#2ecc71' : 
                               entry.status === 'COMPLETED' ? '#27ae60' :
                               '#7f8c8d',
                        fontWeight: 600,
                        padding: '6px 12px',
                        borderRadius: 20,
                        background: entry.status === 'ACTIVE' ? 'rgba(46, 204, 113, 0.1)' : 
                                   entry.status === 'COMPLETED' ? 'rgba(39, 174, 96, 0.1)' : 'rgba(127, 140, 141, 0.1)',
                        display: 'inline-block',
                        fontSize: '0.85rem'
                      }}>
                        {entry.status === 'ACTIVE' ? 'Present' : entry.status === 'COMPLETED' ? 'Complete' : 'Incomplete'}
                      </span>
                    </td>
                  </tr>
                ))}
                
                {attendanceEntries.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ 
                      textAlign: 'center', 
                      padding: '40px 0',
                      color: '#7f8c8d',
                      fontStyle: 'italic'
                    }}>
                      No attendance records available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div style={{ 
            marginTop: '15px', 
            fontSize: '1.1rem', 
            fontWeight: 'bold',
            color: '#2c3e50',
            paddingLeft: '8px'
          }}>
            Total Hours Worked: {totalHours} hrs
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div>
          <h3 style={{ 
            marginBottom: 24, 
            color: '#2c3e50',
            fontWeight: 600,
            fontSize: '1.3rem'
          }}>
            Completed Tasks {taskEntries.length > 0 && `(${taskEntries.length} records)`}
          </h3>
          
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
            marginBottom: 24,
            width: '100%',
            overflowX: 'auto'
          }}>
            <table style={{ 
              width: '100%', 
              fontSize: 14, 
              color: '#2c3e50', 
              borderCollapse: 'collapse',
              minWidth: '600px'
            }}>
              <thead>
                <tr style={{ 
                  textAlign: 'left', 
                  fontWeight: 600,
                  borderBottom: '2px solid #ecf0f1'
                }}>
                  <th style={{ padding: '16px 12px' }}>Date Completed</th>
                  <th style={{ padding: '16px 12px' }}>Task Type</th>
                  <th style={{ padding: '16px 12px' }}>Room #</th>
                  <th style={{ padding: '16px 12px' }}>Priority</th>
                </tr>
              </thead>
              <tbody>
                {taskEntries.map((entry, idx) => (
                  <tr key={idx} style={{ 
                    borderBottom: '1px solid #ecf0f1',
                    transition: 'background 0.2s ease'
                  }}>
                    <td style={{ padding: '16px 12px', fontWeight: 500 }}>{entry.date}</td>
                    <td style={{ padding: '16px 12px' }}>{entry.taskName}</td>
                    <td style={{ padding: '16px 12px', fontWeight: 500 }}>#{entry.roomNumber}</td>
                    <td style={{ padding: '16px 12px' }}>
                      <span style={{
                        color: entry.priority === 'HIGH' ? '#c0392b' : 
                               entry.priority === 'MEDIUM' ? '#d68910' : '#0984e3',
                        fontWeight: 600,
                        padding: '6px 12px',
                        borderRadius: 20,
                        background: entry.priority === 'HIGH' ? 'rgba(192, 57, 43, 0.1)' : 
                                   entry.priority === 'MEDIUM' ? 'rgba(214, 137, 16, 0.1)' : 'rgba(9, 132, 227, 0.1)',
                        display: 'inline-block',
                        fontSize: '0.85rem'
                      }}>
                        {entry.priority}
                      </span>
                    </td>
                  </tr>
                ))}
                
                {taskEntries.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ 
                      textAlign: 'center', 
                      padding: '40px 0',
                      color: '#7f8c8d',
                      fontStyle: 'italic'
                    }}>
                      No completed tasks available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeLogHistory;
