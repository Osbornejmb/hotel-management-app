import React, { useState, useEffect } from 'react';

// Helper function for parsing responses
const parseResponse = async (res) => {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const EmployeeManagementSection = () => {
  const [employees, setEmployees] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ 
    id: '', 
    name: '', 
    job: '', 
    jobTitle: 'Staff', 
    contact: '', 
    status: 'ACTIVE', 
    username: '', 
    email: '', 
    password: '', 
    role: 'employee' 
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchEmployee, setSearchEmployee] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [updatePassword, setUpdatePassword] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Filter employees based on search
  useEffect(() => {
    let filtered = employees;
    
    if (searchEmployee) {
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(searchEmployee.toLowerCase()) ||
        emp.formattedId.includes(searchEmployee) ||
        emp.jobTitle.toLowerCase().includes(searchEmployee.toLowerCase())
      );
    }
    
    setFilteredEmployees(filtered);
  }, [searchEmployee, employees]);

  const handleAddClick = async () => {
    setMessage(null);
    setShowAdd(true);
    try {
      const res = await fetch('/api/users/next-employee-id');
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.padded) {
        setForm(prev => ({ ...prev, id: data.padded }));
      }
    } catch (err) {
      console.error('next-employee-id fetch failed', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    const payload = {
      username: form.username || form.name || form.id,
      name: form.name || form.username || form.id,
      email: form.email || `${form.username || form.name || form.id}@example.com`,
      contact_number: form.contact || '',
      password: form.password || 'defaultPass123',
      role: form.role || 'employee',
      jobTitle: form.jobTitle || 'Staff'
    };

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      await fetchEmployees();
      setShowAdd(false);
      setForm({ 
        id: '', 
        name: '', 
        job: '', 
        jobTitle: 'Staff', 
        contact: '', 
        status: 'ACTIVE', 
        username: '', 
        email: '', 
        password: '', 
        role: 'employee' 
      });
      setMessage({ type: 'success', text: data.message || 'Employee added successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await parseResponse(res); // expect array of Employee documents
      const mapped = (Array.isArray(data) ? data : []).map(u => {
        const empIdNum = typeof u.employeeId === 'number' ? u.employeeId : (typeof u.employeeId === 'string' && /^\d+$/.test(u.employeeId) ? parseInt(u.employeeId,10) : null);
        const formattedId = empIdNum ? String(empIdNum).padStart(4,'0') : (u.employeeCode || u._id || u.username);
        return {
          id: u._id || u.id || u.employeeCode || u.username,
          employeeId: empIdNum,
          formattedId,
          name: u.name || u.fullName || u.username,
          email: u.email || '',
          jobTitle: u.jobTitle || u.position || 'Staff',
          contact: u.contactNumber || u.contact || 'N/A',
          status: (u.status || 'active').toUpperCase(),
          dateHired: u.dateHired || null,
          shift: u.shift || '',
          notes: u.notes || '',
          username: u.username || ''
        };
      });
      setEmployees(mapped.reverse());
    } catch (err) {
      console.error('fetchEmployees error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openModal = (emp) => {
    setSelectedEmployee(emp);
    setUpdatePassword('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedEmployee(null);
    setUpdatePassword('');
    setUpdateLoading(false);
  };

  // Update password function
  const handleUpdatePassword = async () => {
    if (!selectedEmployee || !updatePassword) {
      setMessage({ type: 'error', text: 'Please enter a new password' });
      return;
    }

    if (updatePassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    setUpdateLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/employee/${selectedEmployee.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ password: updatePassword })
      });

      const data = await parseResponse(res);
      const result = (typeof data === 'string') ? { message: data } : data;

      setMessage({ type: 'success', text: result.message || 'Password updated successfully' });
      setUpdatePassword('');
      
      // Close modal after successful update
      setTimeout(() => {
        closeModal();
      }, 1500);
      
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password' });
    } finally {
      setUpdateLoading(false);
    }
  };

  const deleteEmployee = async (emp) => {
    if (!emp || !emp.id) {
      setMessage({ type: 'error', text: 'Invalid employee selected' });
      return;
    }
    const confirmDelete = window.confirm(`Delete ${emp.name || emp.id}? This action cannot be undone.`);
    if (!confirmDelete) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/${emp.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      await fetchEmployees();
      closeModal();
      setMessage({ type: 'success', text: data.message || 'Employee deleted successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Delete failed' });
    }
  };

  const handleExport = () => {
    // Create CSV content
    const csvContent = [
      ['ID', 'Name', 'Job Title', 'Contact', 'Email', 'Status'],
      ...filteredEmployees.map(emp => [
        emp.formattedId,
        emp.name,
        emp.jobTitle,
        emp.contact,
        emp.email,
        emp.status
      ])
    ].map(row => row.join(',')).join('\n');

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusStyle = (status) => {
    const baseStyle = {
      padding: '4px 12px',
      borderRadius: '16px',
      fontSize: '12px',
      fontWeight: '500',
      display: 'inline-block'
    };

    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return {
          ...baseStyle,
          backgroundColor: '#dcfce7',
          color: '#15803d'
        };
      case 'INACTIVE':
        return {
          ...baseStyle,
          backgroundColor: '#fee2e2',
          color: '#dc2626'
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: '#f1f5f9',
          color: '#475569'
        };
    }
  };

  return (
    <div style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <h2 style={{ marginBottom: 24, color: "#1e293b", fontSize: '28px', fontWeight: '600' }}>
        Employee Management
      </h2>

      {/* Filter and Action Controls */}
      <div style={{
        background: "white",
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontWeight: '500', color: '#374151', minWidth: '120px' }}>
              Search Employee:
            </label>
            <input
              type="text"
              placeholder="Enter name or ID..."
              value={searchEmployee}
              onChange={(e) => setSearchEmployee(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                width: '250px'
              }}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleAddClick}
            style={{
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              transition: "0.2s",
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2563eb")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#3b82f6")}
          >
            📋 Add Employee
          </button>
          <button
            onClick={handleExport}
            style={{
              background: "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              transition: "0.2s",
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#059669")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#10b981")}
          >
            ⬇ Export
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          marginBottom: 24,
          padding: "12px 16px",
          borderRadius: 8,
          background: message.type === 'error' ? '#fee2e2' : '#dcfce7',
          color: message.type === 'error' ? '#b91c1c' : '#15803d',
          border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}`
        }}>
          {message.text}
        </div>
      )}

      {/* Add Employee Form */}
      {showAdd && (
        <div style={{
          background: "#fff",
          padding: 24,
          borderRadius: 12,
          marginBottom: 24,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
            Add New Employee
          </h3>
          
          {/* Add Employee */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
              <input 
                name="id" 
                value={form.id} 
                onChange={handleChange} 
                placeholder="Employee ID" 
                style={{ padding: '10px 12px', borderRadius: 6, border: "1px solid #d1d5db", fontSize: '14px' }} 
              />
              <input 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                placeholder="Full Name" 
                style={{ padding: '10px 12px', borderRadius: 6, border: "1px solid #d1d5db", fontSize: '14px' }} 
              />
              <input 
                name="contact" 
                value={form.contact} 
                onChange={handleChange} 
                placeholder="Contact Number" 
                style={{ padding: '10px 12px', borderRadius: 6, border: "1px solid #d1d5db", fontSize: '14px' }} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
              <input 
                name="username" 
                value={form.username} 
                onChange={handleChange} 
                placeholder="Username" 
                style={{ padding: '10px 12px', borderRadius: 6, border: "1px solid #d1d5db", fontSize: '14px' }} 
              />
              <input 
                name="email" 
                value={form.email} 
                onChange={handleChange} 
                placeholder="Email Address" 
                style={{ padding: '10px 12px', borderRadius: 6, border: "1px solid #d1d5db", fontSize: '14px' }} 
              />
              <input 
                name="password" 
                type="password" 
                value={form.password} 
                onChange={handleChange} 
                placeholder="Password" 
                style={{ padding: '10px 12px', borderRadius: 6, border: "1px solid #d1d5db", fontSize: '14px' }} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 20 }}>
              <select 
                name="jobTitle" 
                value={form.jobTitle} 
                onChange={handleChange} 
                style={{ padding: '10px 12px', borderRadius: 6, border: "1px solid #d1d5db", cursor: "pointer", fontSize: '14px' }}
              >
                <option value="Cleaner">Cleaner</option>
                <option value="Clerk">Clerk</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Staff">Staff</option>
              </select>

              {/* Roles */}
              <select 
                name="role" 
                value={form.role} 
                onChange={handleChange} 
                style={{ padding: '10px 12px', borderRadius: 6, border: "1px solid #d1d5db", cursor: "pointer", fontSize: '14px' }}
              >
                <option value="employee">Employee</option>
                <option value="employeeAdmin">Employee Admin</option>
                <option value="hotelAdmin">Hotel Admin</option>
                <option value="restaurantAdmin">Restaurant Admin</option>
              </select>

              <select 
                name="status" 
                value={form.status} 
                onChange={handleChange} 
                style={{ padding: '10px 12px', borderRadius: 6, border: "1px solid #d1d5db", cursor: "pointer", fontSize: '14px' }}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button 
                type="submit" 
                style={{ 
                  background: "#10b981", 
                  color: "#fff", 
                  border: "none", 
                  padding: "10px 20px", 
                  borderRadius: 6, 
                  cursor: "pointer", 
                  fontWeight: '500' 
                }}
              >
                Save Employee
              </button>
              <button 
                type="button" 
                onClick={() => setShowAdd(false)} 
                style={{ 
                  background: "#6b7280", 
                  color: "#fff", 
                  border: "none", 
                  padding: "10px 20px", 
                  borderRadius: 6, 
                  cursor: "pointer", 
                  fontWeight: '500' 
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employee List */}
      <div style={{
        background: "white",
        borderRadius: 12,
        padding: 0,
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e5e7eb',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#374151' 
          }}>
            Employee List ({filteredEmployees.length} employees)
          </h3>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Scroll to view all employees →
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>
            Loading employees...
          </div>
        ) : (
          <div style={{ 
            overflow: 'auto',
            maxHeight: 'calc(100vh - 300px)',
            position: 'relative'
          }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse",
              minWidth: '800px'
            }}>
              <thead>
                <tr style={{ 
                  background: "#f1f5f9", 
                  borderBottom: "2px solid #e2e8f0",
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: "left", 
                    fontWeight: '600', 
                    color: '#374151', 
                    fontSize: '14px',
                    whiteSpace: 'nowrap'
                  }}>EMPLOYEE ID</th>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: "left", 
                    fontWeight: '600', 
                    color: '#374151', 
                    fontSize: '14px',
                    whiteSpace: 'nowrap'
                  }}>EMPLOYEE NAME</th>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: "left", 
                    fontWeight: '600', 
                    color: '#374151', 
                    fontSize: '14px',
                    whiteSpace: 'nowrap'
                  }}>JOB TITLE</th>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: "left", 
                    fontWeight: '600', 
                    color: '#374151', 
                    fontSize: '14px',
                    whiteSpace: 'nowrap'
                  }}>CONTACT</th>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: "left", 
                    fontWeight: '600', 
                    color: '#374151', 
                    fontSize: '14px',
                    whiteSpace: 'nowrap'
                  }}>EMAIL</th>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: "left", 
                    fontWeight: '600', 
                    color: '#374151', 
                    fontSize: '14px',
                    whiteSpace: 'nowrap'
                  }}>STATUS</th>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: "left", 
                    fontWeight: '600', 
                    color: '#374151', 
                    fontSize: '14px',
                    whiteSpace: 'nowrap'
                  }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ 
                      padding: '48px', 
                      textAlign: 'center', 
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      {searchEmployee ? 'No employees found matching your search' : 'No employees found'}
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp, index) => (
                    <tr 
                      key={emp.id} 
                      style={{ 
                        borderBottom: index < filteredEmployees.length - 1 ? "1px solid #f1f5f9" : "none",
                        transition: "background 0.2s",
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : '#fafafa'}
                    >
                      <td style={{ 
                        padding: '16px', 
                        fontSize: '14px', 
                        color: '#374151',
                        fontWeight: '600',
                        whiteSpace: 'nowrap'
                      }}>
                        {emp.formattedId || emp.id}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: '500', 
                          color: '#111827',
                          whiteSpace: 'nowrap'
                        }}>
                          {emp.name}
                        </div>
                        {emp.username && (
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#6b7280', 
                            marginTop: '2px',
                            whiteSpace: 'nowrap'
                          }}>
                            @{emp.username}
                          </div>
                        )}
                      </td>
                      <td style={{ 
                        padding: '16px', 
                        fontSize: '14px', 
                        color: '#374151',
                        whiteSpace: 'nowrap'
                      }}>
                        {emp.jobTitle}
                      </td>
                      <td style={{ 
                        padding: '16px', 
                        fontSize: '14px', 
                        color: '#374151',
                        whiteSpace: 'nowrap'
                      }}>
                        {emp.contact}
                      </td>
                      <td style={{ 
                        padding: '16px', 
                        fontSize: '14px', 
                        color: '#374151',
                        whiteSpace: 'nowrap'
                      }}>
                        {emp.email || '—'}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={getStatusStyle(emp.status)}>
                          {emp.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <button
                          onClick={() => openModal(emp)}
                          style={{
                            color: "#3b82f6",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: '14px',
                            fontWeight: '500',
                            textDecoration: 'underline',
                            whiteSpace: 'nowrap',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#eff6ff';
                            e.target.style.textDecoration = 'none';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'none';
                            e.target.style.textDecoration = 'underline';
                          }}
                        >
                          View/Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && selectedEmployee && (
        <div style={{ 
          position: "fixed", 
          left: 0, 
          top: 0, 
          right: 0, 
          bottom: 0, 
          background: "rgba(0,0,0,0.5)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          zIndex: 9999 
        }}>
          <div style={{ 
            background: "#fff", 
            width: "90%", 
            maxWidth: 600, 
            borderRadius: 12, 
            padding: 32, 
            position: "relative", 
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <button 
              onClick={closeModal} 
              style={{ 
                position: "absolute", 
                right: 16, 
                top: 16, 
                border: "none", 
                background: "#f3f4f6", 
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                fontSize: 16, 
                cursor: "pointer",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
            
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: 24, 
              fontSize: 20, 
              fontWeight: 600, 
              color: '#111827' 
            }}>
              Employee Details
            </h3>
            
            <div style={{ display: "flex", gap: 24, alignItems: 'flex-start' }}>
              <div style={{ 
                width: 80, 
                height: 80, 
                borderRadius: 12, 
                background: "#f3f4f6", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontSize: 32 
              }}>
                👤
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
                  {selectedEmployee.name}
                </div>
                <div style={{ color: "#6b7280", marginBottom: 16, fontSize: '14px' }}>
                  {selectedEmployee.jobTitle}
                </div>
                
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <strong style={{ minWidth: 80, fontSize: '14px', color: '#374151' }}>ID:</strong> 
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      {selectedEmployee.formattedId || selectedEmployee.id}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <strong style={{ minWidth: 80, fontSize: '14px', color: '#374151' }}>Username:</strong> 
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      {selectedEmployee.username || '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <strong style={{ minWidth: 80, fontSize: '14px', color: '#374151' }}>Email:</strong> 
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      {selectedEmployee.email || '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <strong style={{ minWidth: 80, fontSize: '14px', color: '#374151' }}>Contact:</strong> 
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      {selectedEmployee.contact || '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <strong style={{ minWidth: 80, fontSize: '14px', color: '#374151' }}>Status:</strong> 
                    <span style={getStatusStyle(selectedEmployee.status)}>
                      {selectedEmployee.status}
                    </span>
                  </div>
                </div>

                {/* Password Update Section */}
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #e5e7eb' }}>
                  <h4 style={{ 
                    marginBottom: 12, 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#374151' 
                  }}>
                    Update Password
                  </h4>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <input
                        type="password"
                        placeholder="Enter new password..."
                        value={updatePassword}
                        onChange={(e) => setUpdatePassword(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6b7280', 
                        marginTop: '4px' 
                      }}>
                        Password must be at least 6 characters long
                      </div>
                    </div>
                    <button
                      onClick={handleUpdatePassword}
                      disabled={!updatePassword || updatePassword.length < 6 || updateLoading}
                      style={{
                        background: updateLoading || !updatePassword || updatePassword.length < 6 ? '#9ca3af' : '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        cursor: updateLoading || !updatePassword || updatePassword.length < 6 ? 'not-allowed' : 'pointer',
                        fontWeight: '500',
                        minWidth: '120px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      {updateLoading ? (
                        <>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid transparent',
                            borderTop: '2px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }} />
                          Updating...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ 
              display: "flex", 
              justifyContent: "flex-end", 
              gap: 12, 
              marginTop: 32,
              paddingTop: 24,
              borderTop: '1px solid #e5e7eb'
            }}>
              <button 
                onClick={closeModal} 
                style={{ 
                  background: "#f3f4f6", 
                  color: '#374151',
                  border: "none", 
                  padding: "10px 20px", 
                  borderRadius: 8, 
                  cursor: "pointer",
                  fontWeight: '500'
                }}
              >
                Close
              </button>
              <button 
                onClick={() => deleteEmployee(selectedEmployee)} 
                style={{ 
                  background: "#dc2626", 
                  color: "#fff", 
                  border: "none", 
                  padding: "10px 20px", 
                  borderRadius: 8, 
                  cursor: "pointer",
                  fontWeight: '500'
                }}
              >
                Delete Employee
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

export default EmployeeManagementSection;