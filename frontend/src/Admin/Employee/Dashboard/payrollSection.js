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

const PayrollSection = () => {
  const [emps, setEmps] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'paid', 'unpaid'

  useEffect(() => {
    let mounted = true;
    fetchEmployeesBasic().then(list => { if (mounted) setEmps(list); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Generate payroll data
  const allPayrolls = emps.map((e, idx) => ({
    id: e.formattedId,
    employee: e.name,
    periodStart: '8/01/2025',
    periodEnd: '8/31/2025',
    amount: '15,000',
    status: idx % 2 === 0 ? 'Paid' : 'Unpaid',
    action: idx % 2 === 0 ? 'View' : 'Pay'
  }));

  // Filter payrolls based on search term and active tab
  const filteredPayrolls = allPayrolls.filter(payroll => {
    const matchesSearch = payroll.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payroll.employee.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'paid' && payroll.status === 'Paid') ||
      (activeTab === 'unpaid' && payroll.status === 'Unpaid');
    
    return matchesSearch && matchesTab;
  });

  // Show only first 6 results or all filtered results if less than 6
  const displayedPayrolls = filteredPayrolls.slice(0, 6);

  return (
    <div style={{ padding: '24px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <h2 style={{ 
        marginBottom: 24, 
        color: '#2c3e50',
        fontWeight: 600,
        fontSize: '1.8rem'
      }}>
        Payroll Management
      </h2>
      
      {/* Search Bar and Tabs Container */}
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
            minWidth: '120px'
          }}>
            Search Employee:
          </div>
          <input
            type="text"
            placeholder="Enter employee ID or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid #ddd',
              flex: 1,
              fontSize: 14,
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}
          />
        </div>
        
        {/* Status Tabs - Button Style */}
        <div style={{ display: 'flex', gap: 8, background: '#f8f9fa', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '8px 16px',
              background: activeTab === 'all' ? '#3498db' : 'transparent',
              color: activeTab === 'all' ? 'white' : '#7f8c8d',
              border: 'none',
              borderRadius: 6,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '80px'
            }}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('paid')}
            style={{
              padding: '8px 16px',
              background: activeTab === 'paid' ? '#2ecc71' : 'transparent',
              color: activeTab === 'paid' ? 'white' : '#7f8c8d',
              border: 'none',
              borderRadius: 6,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '80px'
            }}
          >
            Paid
          </button>
          <button
            onClick={() => setActiveTab('unpaid')}
            style={{
              padding: '8px 16px',
              background: activeTab === 'unpaid' ? '#e74c3c' : 'transparent',
              color: activeTab === 'unpaid' ? 'white' : '#7f8c8d',
              border: 'none',
              borderRadius: 6,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '80px'
            }}
          >
            Unpaid
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
        Payroll Records
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
              <th style={{ padding: '16px 12px' }}>ID</th>
              <th style={{ padding: '16px 12px' }}>Employee</th>
              <th style={{ padding: '16px 12px' }}>Period Start</th>
              <th style={{ padding: '16px 12px' }}>Period End</th>
              <th style={{ padding: '16px 12px' }}>Amount</th>
              <th style={{ padding: '16px 12px' }}>Status</th>
              <th style={{ padding: '16px 12px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {displayedPayrolls.map((p, idx) => (
              <tr key={p.id || idx} style={{ 
                borderBottom: '1px solid #ecf0f1',
                transition: 'background 0.2s ease',
                ':hover': {
                  background: '#f8f9fa'
                }
              }}>
                <td style={{ padding: '16px 12px', fontWeight: 500 }}>{p.id}</td>
                <td style={{ padding: '16px 12px' }}>{p.employee}</td>
                <td style={{ padding: '16px 12px' }}>{p.periodStart}</td>
                <td style={{ padding: '16px 12px' }}>{p.periodEnd}</td>
                <td style={{ padding: '16px 12px', fontWeight: 600 }}>${p.amount}</td>
                <td style={{ padding: '16px 12px' }}>
                  <span style={{
                    color: p.status === 'Paid' ? '#2ecc71' : '#e74c3c',
                    fontWeight: 600,
                    padding: '6px 12px',
                    borderRadius: 20,
                    background: p.status === 'Paid' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                    display: 'inline-block',
                    fontSize: '0.85rem'
                  }}>
                    {p.status}
                  </span>
                </td>
                <td style={{ padding: '16px 12px' }}>
                  <button style={{
                    color: p.action === 'Pay' ? '#3498db' : '#7f8c8d',
                    background: p.action === 'Pay' ? 'rgba(52, 152, 219, 0.1)' : 'rgba(127, 140, 141, 0.1)',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    ':hover': {
                      background: p.action === 'Pay' ? 'rgba(52, 152, 219, 0.2)' : 'rgba(127, 140, 141, 0.2)'
                    }
                  }}>
                    {p.action}
                  </button>
                </td>
              </tr>
            ))}
            
            {/* Show message if no results found */}
            {displayedPayrolls.length === 0 && (
              <tr>
                <td colSpan={7} style={{ 
                  textAlign: 'center', 
                  padding: '40px 0',
                  color: '#7f8c8d',
                  fontStyle: 'italic'
                }}>
                  {searchTerm || activeTab !== 'all' 
                    ? `No ${activeTab !== 'all' ? activeTab : ''}${searchTerm && activeTab !== 'all' ? ' ' : ''}${searchTerm ? 'payroll records found for this search' : 'payroll records available'}`
                    : 'No payroll records available'}
                </td>
              </tr>
            )}
            
            {/* Add empty rows for consistent spacing if needed */}
            {displayedPayrolls.length > 0 && [...Array(Math.max(0, 6 - displayedPayrolls.length))].map((_, i) => (
              <tr key={i + displayedPayrolls.length} style={{ height: 48 }}>
                <td colSpan={7}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
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
          gap: 8,
          ':hover': {
            background: '#2980b9',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
          }
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Generate Payroll
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
          gap: 8,
          ':hover': {
            background: '#27ae60',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
          }
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 16L4 17C4 18.6569 5.34315 20 7 20L17 20C18.6569 20 20 18.6569 20 17L20 16M16 12L12 16M12 16L8 12M12 16L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Export
        </button>
      </div>
    </div>
  );
};

export default PayrollSection;