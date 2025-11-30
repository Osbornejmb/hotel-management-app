import React, { useState, useEffect } from 'react';

// Helper: fetch attendance records and group by employee
async function fetchAttendanceRecords() {
  try {
    const backendUrl = 'https://hotel-management-app-qo2l.onrender.com';
    console.log('[payrollSection] Fetching from', backendUrl + '/api/attendances');
    const res = await fetch(backendUrl + '/api/attendances');
    
    if (!res.ok) {
      console.error('[payrollSection] API error:', res.statusText);
      return [];
    }
    
    const data = await res.json();
    console.log('[payrollSection] Raw data received:', data);
    return data;
  } catch (err) {
    console.error('[payrollSection] fetchAttendanceRecords error', err);
    return [];
  }
}

// Helper: calculate payroll from attendance records
function calculatePayrollFromAttendance(attendanceRecords) {
  console.log('[payrollSection] calculatePayrollFromAttendance input:', attendanceRecords);
  
  const employeeMap = {};
  const hourlyRate = 95; // PHP per hour

  attendanceRecords.forEach(record => {
    const id = record.cardId || record.employeeId;
    const name = record.name || record.employeeName;
    
    console.log('[payrollSection] Processing record - id:', id, 'name:', name, 'totalHours:', record.totalHours);
    
    // Skip records with no ID
    if (!id) {
      console.log('[payrollSection] Skipping record with no ID');
      return;
    }
    
    if (!employeeMap[id]) {
      employeeMap[id] = {
        cardId: id,
        name: name || 'Unknown',
        totalHours: 0,
        records: []
      };
    }
    employeeMap[id].totalHours += record.totalHours || 0;
    employeeMap[id].records.push(record);
  });

  const result = Object.values(employeeMap).map(emp => ({
    id: emp.cardId,
    employee: emp.name,
    employeeId: emp.cardId,
    totalHours: Math.round(emp.totalHours * 100) / 100,
    amount: Math.round(emp.totalHours * hourlyRate * 100) / 100,
    status: 'Unpaid',
    action: 'Pay',
    records: emp.records
  }));
  
  console.log('[payrollSection] calculatePayrollFromAttendance output:', result);
  return result;
}

// Payment Modal Component
const PaymentModal = ({ isOpen, onClose, payroll, onConfirm }) => {
  const [paymentMethod, setPaymentMethod] = useState('check');
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    await onConfirm();
    setProcessing(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        animation: 'modalAppear 0.3s ease-out'
      }}>
        <style>
          {`
            @keyframes modalAppear {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}
        </style>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #ecf0f1',
          paddingBottom: '16px'
        }}>
          <h3 style={{
            margin: 0,
            color: '#2c3e50',
            fontWeight: 600,
            fontSize: '1.3rem'
          }}>
            Process Payment
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#7f8c8d',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = '#e74c3c'}
            onMouseLeave={(e) => e.target.style.color = '#7f8c8d'}
          >
            ×
          </button>
        </div>

        {/* Employee Details */}
        <div style={{
          background: '#f8f9fa',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 500, color: '#2c3e50' }}>Employee:</span>
            <span style={{ fontWeight: 600 }}>{payroll?.employee}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 500, color: '#2c3e50' }}>Card ID:</span>
            <span style={{ fontWeight: 600 }}>{payroll?.id}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 500, color: '#2c3e50' }}>Pay Period:</span>
            <span>{payroll?.periodStart} - {payroll?.periodEnd}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 500, color: '#2c3e50' }}>Amount:</span>
            <span style={{ fontWeight: 600, color: '#2c3e50', fontSize: '1.1rem' }}>
              ₱{payroll?.amount}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Payment Method Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 600,
              color: '#2c3e50'
            }}>
              Payment Method *
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                border: `2px solid ${paymentMethod === 'check' ? '#3498db' : '#ddd'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: paymentMethod === 'check' ? 'rgba(52, 152, 219, 0.05)' : 'white'
              }}>
                <input
                  type="radio"
                  value="check"
                  checked={paymentMethod === 'check'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ marginRight: '8px' }}
                />
                <div>
                  <div style={{ fontWeight: 500 }}>Check</div>
                  <div style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>
                    Print and mail physical check
                  </div>
                </div>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                border: `2px solid ${paymentMethod === 'cash' ? '#3498db' : '#ddd'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: paymentMethod === 'cash' ? 'rgba(52, 152, 219, 0.05)' : 'white'
              }}>
                <input
                  type="radio"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ marginRight: '8px' }}
                />
                <div>
                  <div style={{ fontWeight: 500 }}>Cash</div>
                  <div style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>
                    Physical cash payment
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Additional Notes */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 600,
              color: '#2c3e50'
            }}>
              Payment Notes (Optional)
            </label>
            <textarea
              placeholder="Add any notes about this payment..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'vertical',
                minHeight: '80px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            borderTop: '1px solid #ecf0f1',
            paddingTop: '20px'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                color: '#7f8c8d',
                border: '1px solid #bdc3c7',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: processing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!processing) {
                  e.target.style.background = '#f8f9fa';
                  e.target.style.color = '#2c3e50';
                }
              }}
              onMouseLeave={(e) => {
                if (!processing) {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#7f8c8d';
                }
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              style={{
                padding: '12px 24px',
                background: processing ? '#95a5a6' : '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: processing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: '120px',
                justifyContent: 'center'
              }}
            >
              {processing ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Processing...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Confirm Payment
                </>
              )}
            </button>
          </div>
        </form>

        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
};

const PayrollSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('unpaid');
  const [payrolls, setPayrolls] = useState([]);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);

  const addDebug = (msg) => {
    const time = new Date().toLocaleTimeString();
    const entry = `${time} - ${msg}`;
    console.log('[Payroll Debug]', entry);
    setDebugLogs(prev => [entry, ...prev].slice(0, 30));
  };

  useEffect(() => {
    let mounted = true;
    fetchAttendanceRecords().then(attendanceData => { 
      if (mounted) {
        const calculatedPayrolls = calculatePayrollFromAttendance(attendanceData);
        setPayrolls(calculatedPayrolls);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Sort payrolls: unpaid first, then paid
  const sortedPayrolls = [...payrolls].sort((a, b) => {
    if (a.status === 'Unpaid' && b.status === 'Paid') return -1;
    if (a.status === 'Paid' && b.status === 'Unpaid') return 1;
    return 0;
  });

  // Filter payrolls based on search term and active tab
  const filteredPayrolls = sortedPayrolls.filter(payroll => {
    const matchesSearch = (payroll.id && payroll.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (payroll.employee && payroll.employee.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'paid' && payroll.status === 'Paid') ||
      (activeTab === 'unpaid' && payroll.status === 'Unpaid');
    
    return matchesSearch && matchesTab;
  });

  const displayedPayrolls = filteredPayrolls.slice(0, 6);

  // Handle Pay button click - opens modal
  const handlePayClick = (payroll) => {
    setSelectedPayroll(payroll);
    setShowPaymentModal(true);
  };

  // Handle payment confirmation
  const handlePaymentConfirm = async () => {
    if (!selectedPayroll) return;

    // Update the payroll status to Paid
    setPayrolls(prev => prev.map(p => 
      p.id === selectedPayroll.id ? { ...p, status: 'Paid', action: 'View' } : p
    ));

    console.log(`Payment processed for payroll ID: ${selectedPayroll.id}`);
  };

  // Handle View button click
  const handleViewClick = (payroll) => {
    console.log('Viewing payroll details:', payroll);
    alert(`Payroll Details:\n\nEmployee: ${payroll.employee}\nID: ${payroll.id}\nTotal Hours: ${payroll.totalHours} hrs\nHourly Rate: ₱95/hr\nAmount: ₱${payroll.amount}\nStatus: ${payroll.status}`);
  };

  // Handle Generate Payroll button click
  const handleGeneratePayroll = () => {
    addDebug('Generate Payroll clicked — starting fetch of attendance records...');
    fetchAttendanceRecords().then(attendanceData => {
      addDebug(`Fetched ${attendanceData.length} attendance record(s) from /api/attendances`);
      const newPayrolls = calculatePayrollFromAttendance(attendanceData);
      setPayrolls(newPayrolls);
      addDebug(`Calculated ${newPayrolls.length} payroll entry(ies)`);
      alert(`Payroll generated successfully for ${newPayrolls.length} employees based on attendance records!`);
    }).catch(err => {
      addDebug(`Error generating payroll: ${err && err.message ? err.message : String(err)}`);
      console.error('Error generating payroll:', err);
      alert('Error generating payroll. Please try again.');
    });
  };

  // Handle Export button click
  const handleExportClick = () => {
    if (filteredPayrolls.length === 0) {
      alert('No payroll records to export.');
      return;
    }

    const headers = ['Card ID', 'Name', 'Period Start', 'Period End', 'Amount', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredPayrolls.map(payroll => [
        payroll.id,
        `"${payroll.employee}"`,
        payroll.periodStart,
        payroll.periodEnd,
        payroll.amount,
        payroll.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payroll-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Exported', filteredPayrolls.length, 'payroll records');
    alert(`Exported ${filteredPayrolls.length} payroll records successfully!`);
  };

  // Handle Search Clear
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Get counts for tabs
  const paidCount = payrolls.filter(p => p.status === 'Paid').length;
  const unpaidCount = payrolls.filter(p => p.status === 'Unpaid').length;
  const allCount = payrolls.length;

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
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '300px', gap: 12 }}>
          <div style={{ 
            fontWeight: 500, 
            color: '#2c3e50',
            minWidth: '120px'
          }}>
            Search Employee:
          </div>
          <div style={{ display: 'flex', flex: 1, gap: 8 }}>
            <input
              type="text"
              placeholder="Enter card ID or name..."
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
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                style={{
                  padding: '12px 16px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = '#7f8c8d'}
                onMouseLeave={(e) => e.target.style.background = '#95a5a6'}
              >
                Clear
              </button>
            )}
          </div>
        </div>
        
        {/* Status Tabs */}
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
              minWidth: '80px',
              position: 'relative'
            }}
          >
            All
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: '#3498db',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '0.7rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              {allCount}
            </span>
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
              minWidth: '80px',
              position: 'relative'
            }}
          >
            Paid
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: '#2ecc71',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '0.7rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              {paidCount}
            </span>
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
              minWidth: '80px',
              position: 'relative'
            }}
          >
            Unpaid
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: '#e74c3c',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '0.7rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              {unpaidCount}
            </span>
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
        Payroll Records {filteredPayrolls.length > 0 && `(${filteredPayrolls.length} records)`}
        {unpaidCount > 0 && activeTab === 'unpaid' && (
          <span style={{ color: '#e74c3c', fontSize: '0.9rem', marginLeft: '12px' }}>
            ⚠️ {unpaidCount} unpaid payroll{unpaidCount !== 1 ? 's' : ''} requiring attention
          </span>
        )}
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
              <th style={{ padding: '16px 12px' }}>Total Hours</th>
              <th style={{ padding: '16px 12px' }}>Hourly Rate</th>
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
                backgroundColor: p.status === 'Unpaid' ? '#fffbfb' : 'transparent'
              }}>
                <td style={{ padding: '16px 12px', fontWeight: 500 }}>{p.id || '-'}</td>
                <td style={{ padding: '16px 12px' }}>{p.employee || 'Unknown'}</td>
                <td style={{ padding: '16px 12px' }}>{p.totalHours} hrs</td>
                <td style={{ padding: '16px 12px' }}>₱95/hr</td>
                <td style={{ padding: '16px 12px', fontWeight: 600 }}>₱{p.amount}</td>
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
                  <button 
                    onClick={() => p.action === 'Pay' ? handlePayClick(p) : handleViewClick(p)}
                    style={{
                      color: p.action === 'Pay' ? '#fff' : '#7f8c8d',
                      background: p.action === 'Pay' ? '#e74c3c' : 'rgba(127, 140, 141, 0.1)',
                      border: 'none',
                      borderRadius: 6,
                      padding: '8px 16px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minWidth: '80px'
                    }}
                    onMouseEnter={(e) => {
                      if (p.action === 'Pay') {
                        e.target.style.background = '#c0392b';
                      } else {
                        e.target.style.background = 'rgba(127, 140, 141, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (p.action === 'Pay') {
                        e.target.style.background = '#e74c3c';
                      } else {
                        e.target.style.background = 'rgba(127, 140, 141, 0.1)';
                      }
                    }}
                  >
                    {p.action}
                  </button>
                </td>
              </tr>
            ))}
            
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
            
            {displayedPayrolls.length > 0 && [...Array(Math.max(0, 6 - displayedPayrolls.length))].map((_, i) => (
              <tr key={i + displayedPayrolls.length} style={{ height: 48 }}>
                <td colSpan={7}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button 
          onClick={handleGeneratePayroll}
          style={{
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
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#2980b9';
            e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#3498db';
            e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.15)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Generate Payroll
        </button>
        <button 
          onClick={handleExportClick}
          disabled={filteredPayrolls.length === 0}
          style={{
            background: filteredPayrolls.length === 0 ? '#95a5a6' : '#2ecc71',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 24px',
            fontWeight: 600,
            fontSize: 14,
            cursor: filteredPayrolls.length === 0 ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: filteredPayrolls.length === 0 ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (filteredPayrolls.length > 0) {
              e.target.style.background = '#27ae60';
              e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (filteredPayrolls.length > 0) {
              e.target.style.background = '#2ecc71';
              e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.15)';
            }
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 16L4 17C4 18.6569 5.34315 20 7 20L17 20C18.6569 20 20 18.6569 20 17L20 16M16 12L12 16M12 16L8 12M12 16L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Export
        </button>
      </div>

      {/* Debug Panel (visible for debugging) */}
      <div style={{ marginTop: 18, background: '#f7f9fb', padding: 12, borderRadius: 8, fontSize: 13 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <strong>Debug Log</strong>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setDebugLogs([]); }} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: '#95a5a6', color: 'white', cursor: 'pointer' }}>Clear</button>
            <button onClick={() => { window.scrollTo(0, document.body.scrollHeight); }} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: '#3498db', color: 'white', cursor: 'pointer' }}>Scroll</button>
          </div>
        </div>
        <div style={{ maxHeight: 160, overflowY: 'auto', borderTop: '1px solid #e6eef6', paddingTop: 8 }}>
          {debugLogs.length === 0 && <div style={{ color: '#7f8c8d' }}>No debug messages yet. Click "Generate Payroll" to see fetch status.</div>}
          {debugLogs.map((d, i) => (
            <div key={i} style={{ padding: '6px 0', borderBottom: i === debugLogs.length - 1 ? 'none' : '1px dashed #e6eef6' }}>{d}</div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        payroll={selectedPayroll}
        onConfirm={handlePaymentConfirm}
      />
    </div>
  );
};

export default PayrollSection;