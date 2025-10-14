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

const AttendanceSection = () => {
  const [emps, setEmps] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');

  useEffect(() => {
    let mounted = true;
    fetchEmployeesBasic().then(list => { if (mounted) setEmps(list); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  // small fake logs using actual employees (one per employee)
  const logs = emps.map((e, idx) => ({
    date: new Date().toLocaleDateString(),
    employee: e.name,
    employeeId: e.formattedId,
    timeIn: '7:30 AM',
    timeOut: '3:30 PM',
    hours: '8Hrs',
    status: idx % 4 === 0 ? 'Late' : idx % 5 === 0 ? 'Early Departure' : 'Present'
  }));

  // Filter logs based on date and employee
  const filteredLogs = logs.filter(log => {
    const matchesDate = !dateFilter || log.date.includes(dateFilter);
    const matchesEmployee = !employeeFilter || 
                           log.employee.toLowerCase().includes(employeeFilter.toLowerCase()) ||
                           log.employeeId.toLowerCase().includes(employeeFilter.toLowerCase());
    
    return matchesDate && matchesEmployee;
  });

  // Handle Filter button click
  const handleFilterClick = () => {
    console.log('Filter applied:', { dateFilter, employeeFilter });
    
    // Show a notification (you can replace this with a proper toast notification)
    alert(`Filters applied:\nDate: ${dateFilter || 'All'}\nEmployee: ${employeeFilter || 'All'}`);
  };

  // Handle Export button click
  const handleExportClick = () => {
    // Create CSV content
    const headers = ['Date', 'Employee', 'Employee ID', 'Time-In', 'Time-Out', 'Hours', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        log.date,
        `"${log.employee}"`, 
        log.employeeId,
        log.timeIn,
        log.timeOut,
        log.hours,
        log.status
      ].join(','))
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Exporting', filteredLogs.length, 'records');
  };

  // Handle View/Edit button click for individual records
  const handleViewEditClick = (log, index) => {
    // In a real application, this would open a modal or navigate to an edit page
    console.log('View/Edit record:', log);
    
    // For demo purposes, show an alert with the record details
    alert(`Editing Record:\n\nDate: ${log.date}\nEmployee: ${log.employee}\nID: ${log.employeeId}\nTime-In: ${log.timeIn}\nTime-Out: ${log.timeOut}\nStatus: ${log.status}`);
    
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setDateFilter('');
    setEmployeeFilter('');
    console.log('Filters reset');
  };

  return (
    <div style={{ padding: '24px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <h2 style={{ 
        marginBottom: 24, 
        color: '#2c3e50',
        fontWeight: 600,
        fontSize: '1.8rem'
      }}>
        Attendance Management
      </h2>
      
      {/* Filters Container */}
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
        {/* Date Filter */}
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '250px' }}>
          <div style={{ 
            marginRight: 12, 
            fontWeight: 500, 
            color: '#2c3e50',
            minWidth: '100px'
          }}>
            Filter by Date:
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
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
        
        {/* Employee Filter */}
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '250px' }}>
          <div style={{ 
            marginRight: 12, 
            fontWeight: 500, 
            color: '#2c3e50',
            minWidth: '100px'
          }}>
            Search Employee:
          </div>
          <input
            type="text"
            placeholder="Enter name or ID..."
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
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
        
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={handleFilterClick}
            style={{
              background: '#3498db',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
            onMouseEnter={(e) => e.target.style.background = '#2980b9'}
            onMouseLeave={(e) => e.target.style.background = '#3498db'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 13V6C22 4.34315 20.6569 3 19 3H5C3.34315 3 2 4.34315 2 6V13M22 13H2M22 13V19C22 20.6569 20.6569 22 19 22H5C3.34315 22 2 20.6569 2 19V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M6 10H6.01M12 10H12.01M18 10H18.01M7 10C7 10.5523 6.55228 11 6 11C5.44772 11 5 10.5523 5 10C5 9.44772 5.44772 9 6 9C6.55228 9 7 9.44772 7 10ZM13 10C13 10.5523 12.5523 11 12 11C11.4477 11 11 10.5523 11 10C11 9.44772 11.4477 9 12 9C12.5523 9 13 9.44772 13 10ZM19 10C19 10.5523 18.5523 11 18 11C17.4477 11 17 10.5523 17 10C17 9.44772 17.4477 9 18 9C18.5523 9 19 9.44772 19 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Filter
          </button>
          <button 
            onClick={handleExportClick}
            disabled={filteredLogs.length === 0}
            style={{
              background: filteredLogs.length === 0 ? '#95a5a6' : '#2ecc71',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              fontWeight: 600,
              fontSize: 14,
              cursor: filteredLogs.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: filteredLogs.length === 0 ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (filteredLogs.length > 0) {
                e.target.style.background = '#27ae60';
              }
            }}
            onMouseLeave={(e) => {
              if (filteredLogs.length > 0) {
                e.target.style.background = '#2ecc71';
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 16L4 17C4 18.6569 5.34315 20 7 20L17 20C18.6569 20 20 18.6569 20 17L20 16M16 12L12 16M12 16L8 12M12 16L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Export
          </button>
          <button 
            onClick={handleResetFilters}
            style={{
              background: 'transparent',
              color: '#7f8c8d',
              border: '1px solid #bdc3c7',
              borderRadius: 8,
              padding: '10px 16px',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f8f9fa';
              e.target.style.color = '#2c3e50';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#7f8c8d';
            }}
          >
            Reset
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
        Attendance Logs {filteredLogs.length > 0 && `(${filteredLogs.length} records)`}
      </div>
      
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
          minWidth: '800px'
        }}>
          <thead>
            <tr style={{ 
              textAlign: 'left', 
              fontWeight: 600,
              borderBottom: '2px solid #ecf0f1'
            }}>
              <th style={{ padding: '16px 12px' }}>Date</th>
              <th style={{ padding: '16px 12px' }}>Employee</th>
              <th style={{ padding: '16px 12px' }}>Time-In</th>
              <th style={{ padding: '16px 12px' }}>Time-Out</th>
              <th style={{ padding: '16px 12px' }}>Hours</th>
              <th style={{ padding: '16px 12px' }}>Status</th>
              <th style={{ padding: '16px 12px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log, idx) => (
              <tr key={idx} style={{ 
                borderBottom: '1px solid #ecf0f1',
                transition: 'background 0.2s ease'
              }}>
                <td style={{ padding: '16px 12px', fontWeight: 500 }}>{log.date}</td>
                <td style={{ padding: '16px 12px' }}>
                  <div>{log.employee}</div>
                  <div style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>ID: {log.employeeId}</div>
                </td>
                <td style={{ padding: '16px 12px', fontWeight: 500 }}>{log.timeIn}</td>
                <td style={{ padding: '16px 12px', fontWeight: 500 }}>{log.timeOut}</td>
                <td style={{ padding: '16px 12px', fontWeight: 600, color: '#3498db' }}>{log.hours}</td>
                <td style={{ padding: '16px 12px' }}>
                  <span style={{
                    color: log.status === 'Present' ? '#2ecc71' : 
                           log.status === 'Late' ? '#e67e22' : '#e74c3c',
                    fontWeight: 600,
                    padding: '6px 12px',
                    borderRadius: 20,
                    background: log.status === 'Present' ? 'rgba(46, 204, 113, 0.1)' : 
                               log.status === 'Late' ? 'rgba(230, 126, 34, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                    display: 'inline-block',
                    fontSize: '0.85rem'
                  }}>
                    {log.status}
                  </span>
                </td>
                <td style={{ padding: '16px 12px' }}>
                  <button 
                    onClick={() => handleViewEditClick(log, idx)}
                    style={{
                      color: '#3498db',
                      background: 'rgba(52, 152, 219, 0.1)',
                      border: 'none',
                      borderRadius: 6,
                      padding: '8px 16px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontSize: '0.85rem'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(52, 152, 219, 0.2)';
                      e.target.style.color = '#2980b9';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(52, 152, 219, 0.1)';
                      e.target.style.color = '#3498db';
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            
            {/* Show message if no results found */}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={7} style={{ 
                  textAlign: 'center', 
                  padding: '40px 0',
                  color: '#7f8c8d',
                  fontStyle: 'italic'
                }}>
                  {dateFilter || employeeFilter 
                    ? 'No attendance records found for the selected filters'
                    : 'No attendance records available'}
                </td>
              </tr>
            )}
            
            {/* Add empty rows for consistent spacing if needed */}
            {filteredLogs.length > 0 && [...Array(Math.max(0, 8 - filteredLogs.length))].map((_, i) => (
              <tr key={i + filteredLogs.length} style={{ height: 48 }}>
                <td colSpan={7}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceSection;