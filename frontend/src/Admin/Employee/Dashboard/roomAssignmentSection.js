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

// Task button style function
function taskBtnStyle(active = false) {
  return {
    background: active ? '#4f46e5' : '#fff',
    color: active ? '#fff' : '#444',
    border: 'none',
    borderRadius: 8,
    padding: '10px 16px',
    fontWeight: 600,
    fontSize: 14,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
  };
}

// Status badge style
function statusBadgeStyle(status) {
  const statusColors = {
    'UNASSIGNED': { bg: '#fef3c7', text: '#92400e' },
    'NOT STARTED': { bg: '#e5e7eb', text: '#374151' },
    'IN PROGRESS': { bg: '#dbeafe', text: '#1e40af' },
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [reassignModal, setReassignModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    fetchEmployeesBasic().then(list => { if (mounted) setEmps(list); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Generate sample assignments with more realistic data
  const generateAssignments = () => {
    const statuses = ['UNASSIGNED', 'NOT STARTED', 'IN PROGRESS', 'COMPLETED'];
    const taskTypes = ['CLEANING', 'MAINTENANCE', 'INSPECTION', 'SETUP'];
    const locations = ['BLDG A', 'BLDG B', 'BLDG C', 'CONFERENCE WING'];
    
    return emps.slice(0, 12).map((e, idx) => {
      const statusIdx = Math.floor(Math.random() * statuses.length);
      const taskIdx = Math.floor(Math.random() * taskTypes.length);
      const locIdx = Math.floor(Math.random() * locations.length);
      
      return {
        id: `room-${500 + idx}`,
        roomId: `${500 + idx}`,
        assigned: e.name,
        employeeId: e.id,
        room: `${500 + idx}`,
        type: taskTypes[taskIdx],
        location: locations[locIdx],
        status: statuses[statusIdx],
        lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000))
      };
    });
  };

  const assignments = generateAssignments();
  
  // Filter assignments based on selected status and search query
  const filteredAssignments = assignments.filter(a => {
    const statusMatch = filterStatus === 'ALL' || a.status === filterStatus;
    const searchMatch = searchQuery === '' || 
      a.roomId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.assigned.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.location.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && searchMatch;
  });

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Handle reassign action
  const handleReassign = (assignment) => {
    setReassignModal(assignment);
  };

  // Handle status change
  const handleStatusChange = (assignmentId, newStatus) => {
    // In a real app, you would update the backend here
    console.log(`Changing status for ${assignmentId} to ${newStatus}`);
  };

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
            placeholder="Search by room, employee, or location..."
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
                {['ALL', 'UNASSIGNED', 'NOT STARTED', 'IN PROGRESS', 'COMPLETED'].map(status => (
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
                                status === 'NOT STARTED' ? '#f39c12' :
                                status === 'IN PROGRESS' ? '#3498db' :
                                status === 'COMPLETED' ? '#2ecc71' : '#7f8c8d'
                    }}></span>
                    {status}
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
        Assignment List
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
              <th style={{ padding: '18px 16px' }}>ROOM ID</th>
              <th style={{ padding: '18px 16px' }}>ASSIGNED TO</th>
              <th style={{ padding: '18px 16px' }}>ROOM</th>
              <th style={{ padding: '18px 16px' }}>TASK TYPE</th>
              <th style={{ padding: '18px 16px' }}>LOCATION</th>
              <th style={{ padding: '18px 16px' }}>STATUS</th>
              <th style={{ padding: '18px 16px' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignments.map((item, idx) => (
              <tr key={idx} style={{
                borderBottom: '1px solid #ecf0f1',
                transition: 'background 0.2s ease',
                ':hover': {
                  background: '#f8f9fa'
                }
              }}>
                <td style={{ padding: '16px', fontWeight: 600 }}>{item.roomId}</td>
                <td style={{ padding: '16px' }}>
                  <div>{item.assigned || 'Unassigned'}</div>
                  {item.assigned && (
                    <div style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>ID: {item.employeeId}</div>
                  )}
                </td>
                <td style={{ padding: '16px', fontWeight: 500 }}>{item.room}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    background: item.type === 'CLEANING' ? 'rgba(46, 204, 113, 0.1)' : 
                               item.type === 'MAINTENANCE' ? 'rgba(52, 152, 219, 0.1)' : 
                               item.type === 'INSPECTION' ? 'rgba(155, 89, 182, 0.1)' : 'rgba(241, 196, 15, 0.1)',
                    color: item.type === 'CLEANING' ? '#2ecc71' : 
                           item.type === 'MAINTENANCE' ? '#3498db' : 
                           item.type === 'INSPECTION' ? '#9b59b6' : '#f1c40f',
                    fontWeight: 500,
                    fontSize: '0.85rem'
                  }}>
                    {item.type}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>{item.location}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    background: item.status === 'COMPLETED' ? 'rgba(46, 204, 113, 0.1)' : 
                               item.status === 'IN PROGRESS' ? 'rgba(52, 152, 219, 0.1)' : 
                               item.status === 'NOT STARTED' ? 'rgba(243, 156, 18, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                    color: item.status === 'COMPLETED' ? '#2ecc71' : 
                           item.status === 'IN PROGRESS' ? '#3498db' : 
                           item.status === 'NOT STARTED' ? '#f39c12' : '#e74c3c',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    {item.status === 'UNASSIGNED' && '◯'}
                    {item.status === 'NOT STARTED' && '◯'}
                    {item.status === 'IN PROGRESS' && '⭮'}
                    {item.status === 'COMPLETED' && '✓'}
                    {item.status}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleReassign(item)}
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
            ))}
            
            {/* Show message if no results found */}
            {filteredAssignments.length === 0 && (
              <tr>
                <td colSpan={7} style={{ 
                  textAlign: 'center', 
                  padding: '40px 0',
                  color: '#7f8c8d',
                  fontStyle: 'italic'
                }}>
                  {searchQuery || filterStatus !== 'ALL' 
                    ? 'No assignments found matching your criteria'
                    : 'No assignments available'}
                </td>
              </tr>
            )}
            
            {/* Add empty rows for consistent spacing if needed */}
            {filteredAssignments.length > 0 && [...Array(Math.max(0, 8 - filteredAssignments.length))].map((_, i) => (
              <tr key={i + filteredAssignments.length} style={{ height: 48 }}>
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
          Create New Assignment
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
          Export Assignments
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
              Reassign Room {reassignModal.roomId}
            </h3>
            <p style={{ marginBottom: 24, color: '#6b7280' }}>
              Current assignment: {reassignModal.assigned || 'Unassigned'}
            </p>
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                Assign to employee
              </label>
              <select style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14
              }}>
                <option value="">Select an employee</option>
                {emps.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.formattedId})
                  </option>
                ))}
              </select>
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
              <button
                onClick={() => {
                  // Handle reassign logic here
                  setReassignModal(null);
                }}
                style={{
                  background: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 16px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomAssignmentSection;