import React, { useState, useEffect } from 'react';

// Helper: fetch basic employee list (id + name + formatted id)
async function fetchEmployeesBasic() {
  try {
    const apiBase = process.env.REACT_APP_API_URL || 'https://hotel-management-app-qo2l.onrender.com';
    const res = await fetch(`${apiBase}/api/users`);
    if (!res.ok) return [];
    const data = await res.json();
    const onlyEmployees = data.filter(u => (u.role || '').toLowerCase() === 'employee');
    return onlyEmployees.map(u => ({
      id: u._id || u.id || u.username,
      name: u.name || u.username,
      formattedId: typeof u.employeeId === 'number' ? String(u.employeeId).padStart(4, '0') : (u._id || u.username),
      jobTitle: u.jobTitle || 'Staff'
    }));
  } catch (err) {
    console.error('fetchEmployeesBasic error', err);
    return [];
  }
}

// Helper: fetch tasks from API
async function fetchTasksFromAPI() {
  try {
    const apiBase = process.env.REACT_APP_API_URL || 'https://hotel-management-app-qo2l.onrender.com';
    const res = await fetch(`${apiBase}/api/tasks`);
    if (!res.ok) return [];
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('fetchTasksFromAPI error', err);
    return [];
  }
}

// Helper: Filter out employees who have active tasks
const filterAvailableEmployees = (employees, tasks) => {
  // Get names of employees who have active tasks (not completed)
  const employeesWithActiveTasks = tasks
    .filter(task => task.status !== 'COMPLETED')
    .map(task => task.assigned);

  // Filter out employees who have active tasks
  return employees.filter(emp => !employeesWithActiveTasks.includes(emp.name));
};

// Status badge style
function statusBadgeStyle(status) {
  const statusColors = {
    'UNASSIGNED': { bg: '#fef3c7', text: '#92400e' },
    'NOT_STARTED': { bg: '#e5e7eb', text: '#374151' },
    'IN_PROGRESS': { bg: '#dbeafe', text: '#1e40af' },
    'COMPLETED': { bg: '#dcfce7', text: '#166534' }
  };
  
  const colorSet = statusColors[status] || { bg: '#e5e7eb', text: '#374151' };
  
  return {
    background: colorSet.bg,
    color: colorSet.text,
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4
  };
}

const RoomAssignmentSection = () => {
  const [emps, setEmps] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [reassignModal, setReassignModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      const tasksData = await fetchTasksFromAPI();
      setTasks(tasksData);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const initializeData = async () => {
      try {
        // Fetch employees
        const employeeList = await fetchEmployeesBasic();
        if (mounted) {
          setEmps(employeeList);
        }

        // Fetch tasks
        await fetchTasks();
      } catch (error) {
        console.error('Error initializing data:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeData();

    return () => { mounted = false; };
  }, []);

  // Convert tasks to room assignments format
  const roomAssignments = tasks.map(task => ({
    id: task.id,
    roomId: task.id,
    assigned: task.assigned,
    employeeId: task.employeeId,
    room: task.room,
    type: task.type,
    location: getLocationFromRoom(task.room), // Generate location based on room number
    status: task.status,
    lastUpdated: task.createdAt,
    jobTitle: task.jobTitle
  }));

  // Helper function to determine location based on room number
  function getLocationFromRoom(room) {
    const roomNum = parseInt(room);
    if (roomNum >= 100 && roomNum <= 199) return 'BLDG A';
    if (roomNum >= 200 && roomNum <= 299) return 'BLDG B';
    if (roomNum >= 300 && roomNum <= 399) return 'BLDG C';
    if (roomNum >= 400 && roomNum <= 499) return 'CONFERENCE WING';
    if (roomNum >= 500 && roomNum <= 599) return 'MAIN HOTEL';
    return 'OTHER';
  }

  // Filter assignments based on selected status and search query
  const filteredAssignments = roomAssignments.filter(a => {
    const statusMatch = filterStatus === 'ALL' || a.status === filterStatus;
    const searchMatch = searchQuery === '' || 
      a.roomId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.assigned?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.room?.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && searchMatch;
  });

  // Filter available employees for reassignment
  const availableEmployees = filterAvailableEmployees(emps, tasks);

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Handle reassign action - now updates the actual task
  const handleReassign = async (taskId, newEmployeeName) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || 'https://hotel-management-app-qo2l.onrender.com';
      const response = await fetch(`${apiBase}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignedTo: newEmployeeName
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update the task in state
        setTasks(prev => prev.map(task => 
          task.id === taskId ? result.task : task
        ));
        
        alert('Task reassigned successfully!');
      } else {
        const error = await response.json();
        alert(`Error reassigning: ${error.error}`);
      }
    } catch (error) {
      console.error('Error reassigning:', error);
      alert('Error reassigning task. Please try again.');
    }
  };

  // Handle export assignments - now exports task data
  const handleExportAssignments = async () => {
    if (filteredAssignments.length === 0) {
      alert('No assignments to export.');
      return;
    }

    setExportLoading(true);
    
    try {
      // Create CSV content based on task data
      const headers = ['Task ID', 'Assigned To', 'Employee ID', 'Room', 'Task Type', 'Location', 'Status', 'Priority', 'Job Title', 'Created Date'];
      const csvContent = [
        headers.join(','),
        ...filteredAssignments.map(assignment => [
          assignment.id,
          `"${assignment.assigned || 'Unassigned'}"`,
          assignment.employeeId || 'N/A',
          assignment.room,
          assignment.type,
          assignment.location,
          assignment.status,
          tasks.find(t => t.id === assignment.id)?.priority || 'N/A',
          assignment.jobTitle || 'Staff',
          assignment.lastUpdated ? new Date(assignment.lastUpdated).toLocaleDateString() : 'N/A'
        ].join(','))
      ].join('\n');

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `room-assignments-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Exported', filteredAssignments.length, 'assignments');
      
      // Show success message
      setTimeout(() => {
        alert(`Successfully exported ${filteredAssignments.length} assignments!`);
      }, 500);
      
    } catch (error) {
      console.error('Error exporting assignments:', error);
      alert('Failed to export assignments. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  // Handle status change - now updates the actual task
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || 'https://hotel-management-app-qo2l.onrender.com';
      const response = await fetch(`${apiBase}/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update the task in state
        setTasks(prev => prev.map(task => 
          task.id === taskId ? result.task : task
        ));
        
        alert('Status updated successfully!');
      } else {
        const error = await response.json();
        alert(`Error updating status: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status. Please try again.');
    }
  };

  // Format status for display
  const formatStatus = (status) => {
    return status.replace('_', ' ');
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '24px', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '200px'
      }}>
        <div>Loading room assignments...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <h2 style={{ 
        marginBottom: 24, 
        color: '#2c3e50',
        fontWeight: 600,
        fontSize: '1.8rem'
      }}>
        Room Assignments
      </h2>
      
      <div style={{ 
        background: '#e8f4fd', 
        padding: '16px', 
        borderRadius: '8px', 
        marginBottom: '24px',
        border: '1px solid #b3d9ff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>📋</span>
          <div>
            <strong>Room Assignment Overview</strong>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Showing {filteredAssignments.length} room assignments from task data
            </div>
          </div>
        </div>
      </div>
      
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
            Search Rooms:
          </div>
          <input
            type="text"
            placeholder="Search by room, employee, task ID, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
        
        {/* Date and Filter Buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <button 
              style={{
                padding: '8px 16px',
                background: showDatePicker ? '#3498db' : '#f8f9fa',
                color: showDatePicker ? 'white' : '#7f8c8d',
                border: 'none',
                borderRadius: 20,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }} 
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              <span role="img" aria-label="calendar">📅</span> 
              {formatDate(selectedDate)}
            </button>
            
            {showDatePicker && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                background: '#fff',
                borderRadius: 8,
                padding: 16,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 10,
                marginTop: 8
              }}>
                <input 
                  type="date" 
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  style={{
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    padding: 8,
                    fontSize: 14
                  }}
                />
              </div>
            )}
          </div>
          
          <div style={{ position: 'relative' }}>
            <button 
              style={{
                padding: '8px 16px',
                background: showFilterMenu ? '#3498db' : '#f8f9fa',
                color: showFilterMenu ? 'white' : '#7f8c8d',
                border: 'none',
                borderRadius: 20,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }} 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <span role="img" aria-label="filter">☰</span> FILTER
            </button>
            
            {showFilterMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: '#fff',
                borderRadius: 8,
                padding: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 10,
                marginTop: 8,
                minWidth: 180
              }}>
                {['ALL', 'UNASSIGNED', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].map(status => (
                  <button
                    key={status}
                    onClick={() => {
                      setFilterStatus(status);
                      setShowFilterMenu(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      background: filterStatus === status ? '#f3f4f6' : 'transparent',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14,
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <span style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: status === 'UNASSIGNED' ? '#e74c3c' : 
                                status === 'NOT_STARTED' ? '#f39c12' :
                                status === 'IN_PROGRESS' ? '#3498db' :
                                status === 'COMPLETED' ? '#2ecc71' : '#7f8c8d'
                    }}></span>
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div style={{ 
        marginBottom: 16, 
        fontWeight: 600, 
        color: '#2c3e50',
        fontSize: '1.1rem',
        paddingLeft: '8px'
      }}>
        Room Assignment List {filteredAssignments.length > 0 && `(${filteredAssignments.length} assignments)`}
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
              <th style={{ padding: '18px 16px' }}>LOCATION</th>
              <th style={{ padding: '18px 16px' }}>STATUS</th>
              <th style={{ padding: '18px 16px' }}>PRIORITY</th>
              <th style={{ padding: '18px 16px' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignments.map((assignment, idx) => {
              const originalTask = tasks.find(t => t.id === assignment.id);
              return (
                <tr key={idx} style={{
                  borderBottom: '1px solid #ecf0f1',
                  transition: 'background 0.2s ease'
                }}>
                  <td style={{ padding: '16px', fontWeight: 600 }}>{assignment.id}</td>
                  <td style={{ padding: '16px' }}>
                    <div>{assignment.assigned || 'Unassigned'}</div>
                    {assignment.assigned && (
                      <div style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>
                        ID: {assignment.employeeId} • {assignment.jobTitle}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px', fontWeight: 500 }}>{assignment.room}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      background: assignment.type === 'CLEANING' ? 'rgba(46, 204, 113, 0.1)' : 
                                 assignment.type === 'MAINTENANCE' ? 'rgba(52, 152, 219, 0.1)' : 
                                 assignment.type === 'INSPECTION' ? 'rgba(155, 89, 182, 0.1)' : 'rgba(241, 196, 15, 0.1)',
                      color: assignment.type === 'CLEANING' ? '#2ecc71' : 
                             assignment.type === 'MAINTENANCE' ? '#3498db' : 
                             assignment.type === 'INSPECTION' ? '#9b59b6' : '#f1c40f',
                      fontWeight: 500,
                      fontSize: '0.85rem'
                    }}>
                      {assignment.type}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>{assignment.location}</td>
                  <td style={{ padding: '16px' }}>
                    <select
                      value={assignment.status}
                      onChange={(e) => handleStatusChange(assignment.id, e.target.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 20,
                        border: '1px solid #ddd',
                        background: assignment.status === 'COMPLETED' ? 'rgba(46, 204, 113, 0.1)' : 
                                   assignment.status === 'IN_PROGRESS' ? 'rgba(52, 152, 219, 0.1)' : 
                                   assignment.status === 'NOT_STARTED' ? 'rgba(243, 156, 18, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                        color: assignment.status === 'COMPLETED' ? '#2ecc71' : 
                               assignment.status === 'IN_PROGRESS' ? '#3498db' : 
                               assignment.status === 'NOT_STARTED' ? '#f39c12' : '#e74c3c',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="UNASSIGNED">UNASSIGNED</option>
                      <option value="NOT_STARTED">NOT STARTED</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      background: originalTask?.priority === 'HIGH' ? 'rgba(231, 76, 60, 0.1)' : 
                                 originalTask?.priority === 'MEDIUM' ? 'rgba(243, 156, 18, 0.1)' : 'rgba(46, 204, 113, 0.1)',
                      color: originalTask?.priority === 'HIGH' ? '#e74c3c' : 
                             originalTask?.priority === 'MEDIUM' ? '#f39c12' : '#2ecc71',
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}>
                      {originalTask?.priority || 'N/A'}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => setReassignModal(assignment)}
                        style={{
                          background: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          padding: '8px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Reassign
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {/* Show message if no results found */}
            {filteredAssignments.length === 0 && (
              <tr>
                <td colSpan={8} style={{ 
                  textAlign: 'center', 
                  padding: '40px 0',
                  color: '#7f8c8d',
                  fontStyle: 'italic'
                }}>
                  {searchQuery || filterStatus !== 'ALL' 
                    ? 'No room assignments found matching your criteria'
                    : 'No room assignments available. Create tasks in the Task Management section.'}
                </td>
              </tr>
            )}
            
            {/* Add empty rows for consistent spacing if needed */}
            {filteredAssignments.length > 0 && [...Array(Math.max(0, 8 - filteredAssignments.length))].map((_, i) => (
              <tr key={i + filteredAssignments.length} style={{ height: 48 }}>
                <td colSpan={8}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button 
          onClick={handleExportAssignments}
          disabled={exportLoading || filteredAssignments.length === 0}
          style={{
            background: exportLoading || filteredAssignments.length === 0 ? '#95a5a6' : '#2ecc71',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 24px',
            fontWeight: 600,
            fontSize: 14,
            cursor: exportLoading || filteredAssignments.length === 0 ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: filteredAssignments.length === 0 ? 0.6 : 1
          }}
        >
          {exportLoading ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid transparent',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Exporting...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 16L4 17C4 18.6569 5.34315 20 7 20L17 20C18.6569 20 20 18.6569 20 17L20 16M16 12L12 16M12 16L8 12M12 16L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Export Assignments
            </>
          )}
        </button>
      </div>
      
      {/* Reassign Modal */}
      {reassignModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 24,
            width: '90%',
            maxWidth: 500,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>
              Reassign Room {reassignModal.room} (Task: {reassignModal.id})
            </h3>
            <p style={{ marginBottom: 24, color: '#6b7280' }}>
              Current assignment: {reassignModal.assigned || 'Unassigned'}
            </p>
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                Assign to employee
              </label>
              <select 
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14
                }}
                onChange={(e) => {
                  if (e.target.value) {
                    handleReassign(reassignModal.id, e.target.value);
                    setReassignModal(null);
                  }
                }}
              >
                <option value="">Select an employee</option>
                {availableEmployees.map(emp => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name} ({emp.formattedId}) - {emp.jobTitle}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '0.8rem', color: '#7f8c8d', marginTop: '4px' }}>
                Available: {availableEmployees.length} of {emps.length} employees
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setReassignModal(null)}
                style={{
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 16px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default RoomAssignmentSection;