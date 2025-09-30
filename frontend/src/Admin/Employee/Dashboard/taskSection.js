import React, { useState, useEffect } from 'react';

// Helper: fetch basic employee list (id + name + formatted id)
async function fetchEmployeesBasic() {
  try {
    const res = await fetch('/api/users');
    if (!res.ok) return [];
    const data = await res.json();
    const onlyEmployees = data.filter(u => (u.role || '').toLowerCase() === 'employee');
    return onlyEmployees.map(u => ({
      id: u._id || u.id || u.username,
      name: u.name || u.username,
      formattedId: typeof u.employeeId === 'number' ? String(u.employeeId).padStart(4, '0') : (u._id || u.username)
    }));
  } catch (err) {
    console.error('fetchEmployeesBasic error', err);
    return [];
  }
}

const TasksSection = () => {
  const [emps, setEmps] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let mounted = true;
    fetchEmployeesBasic().then(list => { if (mounted) setEmps(list); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Generate tasks with different statuses
  const tasks = emps.slice(0, 7).map((e, idx) => ({ 
    id: `T${1000 + idx}`, 
    assigned: e.name, 
    employeeId: e.formattedId,
    room: `${500 + idx}`, 
    type: idx % 3 === 0 ? 'CLEANING' : idx % 3 === 1 ? 'MAINTENANCE' : 'INSPECTION', 
    status: idx % 4 === 0 ? 'UNASSIGNED' : idx % 4 === 1 ? 'NOT STARTED' : idx % 4 === 2 ? 'IN PROGRESS' : 'COMPLETED',
    priority: idx % 3 === 0 ? 'HIGH' : idx % 3 === 1 ? 'MEDIUM' : 'LOW'
  }));

  // Filter tasks based on active filter and search term
  const filteredTasks = tasks.filter(task => {
    const matchesFilter = activeFilter === 'all' || task.status === activeFilter.toUpperCase();
    const matchesSearch = !searchTerm || 
                         task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.assigned.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.room.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ padding: '24px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <h2 style={{ 
        marginBottom: 24, 
        color: '#2c3e50',
        fontWeight: 600,
        fontSize: '1.8rem'
      }}>
        Task Management
      </h2>
      
      {/* Filters and Search Container */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16,
        background: '#fff',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
      }}>
        {/* Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '300px' }}>
          <div style={{ 
            marginRight: 12, 
            fontWeight: 500, 
            color: '#2c3e50',
            minWidth: '100px'
          }}>
            Search Tasks:
          </div>
          <input
            type="text"
            placeholder="Search by ID, employee, or room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #ddd',
              flex: 1,
              fontSize: 14,
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          />
        </div>
        
        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveFilter('all')}
            style={{
              padding: '8px 16px',
              background: activeFilter === 'all' ? '#3498db' : '#f8f9fa',
              color: activeFilter === 'all' ? 'white' : '#7f8c8d',
              border: 'none',
              borderRadius: 20,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>All Tasks</span>
          </button>
          <button
            onClick={() => setActiveFilter('unassigned')}
            style={{
              padding: '8px 16px',
              background: activeFilter === 'unassigned' ? '#e74c3c' : '#f8f9fa',
              color: activeFilter === 'unassigned' ? 'white' : '#7f8c8d',
              border: 'none',
              borderRadius: 20,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: activeFilter === 'unassigned' ? '#fff' : '#e74c3c'
            }}></span>
            Unassigned
          </button>
          <button
            onClick={() => setActiveFilter('not started')}
            style={{
              padding: '8px 16px',
              background: activeFilter === 'not started' ? '#f39c12' : '#f8f9fa',
              color: activeFilter === 'not started' ? 'white' : '#7f8c8d',
              border: 'none',
              borderRadius: 20,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: activeFilter === 'not started' ? '#fff' : '#f39c12'
            }}></span>
            Not Started
          </button>
        </div>
      </div>
      
      <div style={{ 
        marginBottom: 16, 
        fontWeight: 600, 
        color: '#2c3e50',
        fontSize: '1.1rem',
        paddingLeft: '8px'
      }}>
        Task List
      </div>
      
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: 0,
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
          minWidth: '800px'
        }}>
          <thead>
            <tr style={{ 
              textAlign: 'left', 
              fontWeight: 600,
              background: '#f8f9fa'
            }}>
              <th style={{ padding: '18px 16px' }}>TASK ID</th>
              <th style={{ padding: '18px 16px' }}>ASSIGNED TO</th>
              <th style={{ padding: '18px 16px' }}>ROOM</th>
              <th style={{ padding: '18px 16px' }}>TASK TYPE</th>
              <th style={{ padding: '18px 16px' }}>STATUS</th>
              <th style={{ padding: '18px 16px' }}>PRIORITY</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task, idx) => (
              <tr key={idx} style={{
                borderBottom: '1px solid #ecf0f1',
                transition: 'background 0.2s ease',
                ':hover': {
                  background: '#f8f9fa'
                }
              }}>
                <td style={{ padding: '16px', fontWeight: 600 }}>{task.id}</td>
                <td style={{ padding: '16px' }}>
                  <div>{task.assigned}</div>
                  <div style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>ID: {task.employeeId}</div>
                </td>
                <td style={{ padding: '16px', fontWeight: 500 }}>{task.room}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    background: task.type === 'CLEANING' ? 'rgba(46, 204, 113, 0.1)' : 
                               task.type === 'MAINTENANCE' ? 'rgba(52, 152, 219, 0.1)' : 'rgba(155, 89, 182, 0.1)',
                    color: task.type === 'CLEANING' ? '#2ecc71' : 
                           task.type === 'MAINTENANCE' ? '#3498db' : '#9b59b6',
                    fontWeight: 500,
                    fontSize: '0.85rem'
                  }}>
                    {task.type}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    background: task.status === 'COMPLETED' ? 'rgba(46, 204, 113, 0.1)' : 
                               task.status === 'IN PROGRESS' ? 'rgba(52, 152, 219, 0.1)' : 
                               task.status === 'NOT STARTED' ? 'rgba(243, 156, 18, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                    color: task.status === 'COMPLETED' ? '#2ecc71' : 
                           task.status === 'IN PROGRESS' ? '#3498db' : 
                           task.status === 'NOT STARTED' ? '#f39c12' : '#e74c3c',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}>
                    {task.status}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    background: task.priority === 'HIGH' ? 'rgba(231, 76, 60, 0.1)' : 
                               task.priority === 'MEDIUM' ? 'rgba(243, 156, 18, 0.1)' : 'rgba(46, 204, 113, 0.1)',
                    color: task.priority === 'HIGH' ? '#e74c3c' : 
                           task.priority === 'MEDIUM' ? '#f39c12' : '#2ecc71',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}>
                    {task.priority}
                  </span>
                </td>
              </tr>
            ))}
            
            {/* Show message if no results found */}
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={7} style={{ 
                  textAlign: 'center', 
                  padding: '40px 0',
                  color: '#7f8c8d',
                  fontStyle: 'italic'
                }}>
                  {searchTerm || activeFilter !== 'all' 
                    ? 'No tasks found matching your criteria'
                    : 'No tasks available'}
                </td>
              </tr>
            )}
            
            {/* Add empty rows for consistent spacing if needed */}
            {filteredTasks.length > 0 && [...Array(Math.max(0, 8 - filteredTasks.length))].map((_, i) => (
              <tr key={i + filteredTasks.length} style={{ height: 48 }}>
                <td colSpan={7}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button style={{
          background: '#3498db',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '12px 24px',
          fontWeight: 600,
          fontSize: 14,
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Create New Task
        </button>
        <button style={{
          background: '#2ecc71',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '12px 24px',
          fontWeight: 600,
          fontSize: 14,
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 16L4 17C4 18.6569 5.34315 20 7 20L17 20C18.6569 20 20 18.6569 20 17L20 16M16 12L12 16M12 16L8 12M12 16L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Export Tasks
        </button>
      </div>
    </div>
  );
};

export default TasksSection; 