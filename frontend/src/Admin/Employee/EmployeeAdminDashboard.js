import React, { useState, useEffect } from 'react';
import LogoutButton from '../../Auth/LogoutButton';

// simple icons for sidebar
const navIcons = {
  dashboard: '🏠',
  employee: '👥',
  attendance: '📅',
  payroll: '💳',
  tasks: '🧾',
  room: '🛏️'
};
const sections = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'employee', label: 'Employee Management' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'payroll', label: 'Payroll' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'room', label: 'Room Assignment' },
];

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

function EmployeeAdminDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f7f7' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: '#4b2b17',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRight: '1px solid rgba(0,0,0,0.08)',
        position: 'relative',
        color: '#fff',
        minHeight: '100vh'
      }}>
        {/* CSS for sidebar buttons: use sidebar bg, white inset border on hover, and #888 for active */}
        <style>{`
          .sidebar-btn {
            width: 100%;
            padding: 10px 12px;
            margin-bottom: 12px;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            color: #fff;
            text-align: left;
            cursor: pointer;
            background: #4b2b17; /* same as sidebar */
            display: flex;
            align-items: center;
            transition: box-shadow 140ms ease, background 140ms ease;
          }
          .sidebar-btn:hover {
            /* use inset box-shadow to simulate a white border without shifting layout */
            box-shadow: inset 0 0 0 2px rgba(255,255,255,0.95);
          }
          .sidebar-btn.active {
            background: #888 !important;
            color: #fff;
            box-shadow: none;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 4px solid rgba(0,0,0,0.08);
            border-top-color: rgba(0,0,0,0.2);
            animation: spin 800ms linear infinite;
            margin: 24px auto;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
        <div onClick={() => setActiveSection('profile')} style={{ cursor: 'pointer', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 12 }}>
          <div style={{
            width: '100%',
            padding: 12,
            borderRadius: 8,
            background: '#d2aa3a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2f1b0a'
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#2f1b0a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 24,
              marginBottom: 8
            }}>
              <span style={{ opacity: 0.95 }}>◯</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#2f1b0a', marginTop: 4 }}>{localStorage.getItem('name') || localStorage.getItem('username') || 'Admin'}</div>
            <div style={{ color: '#2f1b0a', marginBottom: 8, fontSize: 12 }}>{localStorage.getItem('role') || 'Admin'}</div>
          </div>
        </div>
        <nav style={{ width: '100%' }}>
          {sections.map(sec => (
            <button
              key={sec.key}
              className={`sidebar-btn ${activeSection === sec.key ? 'active' : ''}`}
              onClick={() => setActiveSection(sec.key)}
            >
              <span style={{ marginRight: 12, fontSize: 18 }}>{navIcons[sec.key] || '•'}</span>
              {sec.label}
            </button>
          ))}
        </nav>
        <div style={{
          position: 'absolute',
          left: 24,
          bottom: 24,
          width: 'calc(100% - 48px)'
        }}>
          <LogoutButton style={{
            width: '100%',
            background: 'transparent',
            color: '#dabf84',
            border: 'none',
            textAlign: 'left',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer'
          }} />
        </div>
      </aside>

      {/* Main Section */}
      <main style={{ flex: 1, padding: 40 }}>
        {activeSection === 'dashboard' && <DashboardSection />}
        {activeSection === 'employee' && <EmployeeManagementSection />}
        {activeSection === 'attendance' && <AttendanceSection />}
        {activeSection === 'payroll' && <PayrollSection title="Payroll" />}
        {activeSection === 'tasks' && <TasksSection title="Tasks" />}
        {activeSection === 'room' && <RoomAssignmentSection />}
        {activeSection === 'profile' && <ProfileSection />}
      </main>
    </div>
  );
}

// Profile section (basic)
function ProfileSection() {
  // attempt to get richer profile data from backend; fall back to localStorage
  const [profile, setProfile] = React.useState({
    name: localStorage.getItem('name') || localStorage.getItem('username') || 'Admin',
    role: localStorage.getItem('role') || 'Admin',
    email: localStorage.getItem('email') || '',
    phone: '',
    id: localStorage.getItem('userId') || '',
    position: '',
    hireDate: ''
  });

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return; // no token, bail out

    // safe fetch to /api/users/me to retrieve profile details if backend provides it
    (async () => {
      try {
        const res = await fetch('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        // merge returned fields with existing
        setProfile(prev => ({ ...prev,
          name: data.name || data.username || prev.name,
          role: data.role || prev.role,
          email: data.email || prev.email,
          phone: data.phone || prev.phone,
          id: data.id || data._id || prev.id,
          position: data.position || data.job || prev.position,
          hireDate: data.hireDate || prev.hireDate
        }));
      } catch (err) {
        // ignore fetch errors and keep local info
        // console.debug('profile fetch failed', err);
      }
    })();
  }, []);

  // format hire date if present
  const formattedHireDate = profile.hireDate ? (new Date(profile.hireDate)).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Profile</h2>
      <div style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 6px 28px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
          {/* left avatar block */}
          <div style={{ width: 160 }}>
            <div style={{ width: 120, height: 120, borderRadius: 12, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
              ◯
            </div>
          </div>

          {/* center main info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: '#6b3f1f', fontSize: 26, fontWeight: 800 }}>{profile.name}</div>
                <div style={{ color: '#9b8f83', marginTop: 8, fontSize: 16 }}>{profile.position || '—'}</div>
                <div style={{ color: '#b0acaa', marginTop: 12, fontWeight: 600 }}>ID: <span style={{ color: '#7b7b7b', fontWeight: 400 }}>{profile.id || '—'}</span></div>
              </div>
              <div>
                <span style={{ display: 'inline-block', background: '#e9d8b7', color: '#6b3f1f', padding: '8px 14px', borderRadius: 20, fontWeight: 700 }}>ONLINE</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 36 }}>
              <div>
                <div style={{ fontWeight: 700, color: '#6b3f1f', marginBottom: 12 }}>Personal Information</div>
                <div style={{ color: '#8a8a8a', marginBottom: 8 }}><strong style={{ color: '#444' }}>Email:</strong> {profile.email || '—'}</div>
                <div style={{ color: '#8a8a8a', marginBottom: 8 }}><strong style={{ color: '#444' }}>Phone:</strong> {profile.phone || '—'}</div>
              </div>

              <div>
                <div style={{ fontWeight: 700, color: '#6b3f1f', marginBottom: 12 }}>Employment Details</div>
                <div style={{ color: '#8a8a8a', marginBottom: 8 }}><strong style={{ color: '#444' }}>Hire Date:</strong> {formattedHireDate || '—'}</div>
                <div style={{ color: '#8a8a8a', marginBottom: 8 }}><strong style={{ color: '#444' }}>Position:</strong> {profile.position || '—'}</div>
                <div style={{ color: '#8a8a8a', marginTop: 8 }}><strong style={{ color: '#444' }}>Role:</strong> {profile.role}</div>
              </div>
            </div>

            <div style={{ marginTop: 36 }}>
              <button style={{ padding: '10px 18px', borderRadius: 8, background: '#e7d4a3', border: 'none', color: '#6b3f1f', fontWeight: 700, cursor: 'pointer' }}>Edit Profile</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard Section (analytics)
function DashboardSection() {
  return (
    <div>
      <h2 style={{ marginBottom: 32 }}>Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        <Card title="Total Employees" value="24" />
        <Card title="Present Today" value="19" />
        <Card title="Payroll Status">
          <div style={{ display: 'flex', alignItems: 'center', height: 120 }}>
            <PieChart />
            <div style={{ marginLeft: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ccc', display: 'inline-block', marginRight: 8 }} />
                Paid
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#888', display: 'inline-block', marginRight: 8 }} />
                Unpaid
              </div>
            </div>
          </div>
        </Card>
        <Card title="Total Payroll" value="260,000" />
        <Card title="Pending Tasks" value="21" />
        <Card title="Recent Logs">
          <table style={{ width: '100%', fontSize: 14, color: '#666', marginTop: 8 }}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Time-in</th>
                <th>Time-Out</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td style={{ padding: '8px 0' }}></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Task Completion Rate">
          <BarChart />
        </Card>
      </div>
    </div>
  );
}

// Employee Management Section
function EmployeeManagementSection() {
  const [employees, setEmployees] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', job: '', jobTitle: 'Staff', contact: '', status: 'ACTIVE', username: '', email: '', password: '', role: 'employee' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddClick = async () => {
    setMessage(null);
    setShowAdd(true);
    // request the recommended next employee id from backend
    try {
      const res = await fetch('/api/users/next-employee-id');
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.padded) {
        setForm(prev => ({ ...prev, id: data.padded }));
      }
    } catch (err) {
      // ignore — form will open without prefilling
      console.error('next-employee-id fetch failed', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    // Prepare payload for backend user registration
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
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      // after successful add, re-fetch the employees list from backend
      await fetchEmployees();
      setShowAdd(false);
      setForm({ id: '', name: '', job: '', contact: '', status: 'ACTIVE', username: '', email: '', password: '', role: 'employee' });
      setMessage({ type: 'success', text: data.message || 'Employee added' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // fetch employees from backend
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch employees');
      const data = await res.json();
      // map users to table rows
      const onlyEmployees = data.filter(u => (u.role || '').toLowerCase() === 'employee');
      const mapped = onlyEmployees.map(u => ({
        id: u._id || u.id || u.username,
        employeeId: typeof u.employeeId === 'number' ? u.employeeId : null,
        formattedId: typeof u.employeeId === 'number' ? String(u.employeeId).padStart(4, '0') : (u._id || u.username),
        name: u.name || u.username,
        email: u.email || '',
        jobTitle: u.jobTitle || u.position || u.job || 'Staff',
        // prefer contact_number (new schema), fall back to phone
        contact: u.contact_number || u.phone || 'N/A',
        status: u.status || 'ACTIVE'
      }));
      setEmployees(mapped.reverse()); // show newest first
    } catch (err) {
      // keep empty list on error
      console.error('fetchEmployees error', err);
    } finally {
      setLoading(false);
    }
  };

  // load employees on mount
  React.useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // modal handlers (defined inside component so they can use state setters)
  const openModal = (emp) => {
    setSelectedEmployee(emp);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedEmployee(null);
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
      // refresh list and close modal
      await fetchEmployees();
      closeModal();
      setMessage({ type: 'success', text: data.message || 'Employee deleted' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Delete failed' });
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Employee Management</h2>
      <div style={{ marginBottom: 12, fontWeight: 500 }}>Employee Table</div>

      {/* Add Employee button and form */}
      <div style={{ marginBottom: 12 }}>
        <button onClick={handleAddClick} style={{
          background: '#888',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          padding: '10px 24px',
          fontWeight: 600,
          fontSize: 16,
          cursor: 'pointer'
        }}>+ Add Employee</button>
      </div>

      {message && (
        <div style={{ marginBottom: 12, color: message.type === 'error' ? '#b00020' : '#0b6b0b' }}>{message.text}</div>
      )}

      {showAdd && (
        <form onSubmit={handleSubmit} style={{
          background: '#fff',
          padding: 16,
          borderRadius: 8,
          marginBottom: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          width: '90%',
          maxWidth: 700
        }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            <input name="id" value={form.id} onChange={handleChange} placeholder="ID" style={{ flex: 1, padding: 8 }} />
            <input name="name" value={form.name} onChange={handleChange} placeholder="Full name" style={{ flex: 2, padding: 8 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            <input name="contact" value={form.contact} onChange={handleChange} placeholder="Contact" style={{ flex: 1, padding: 8 }} />
            <input name="username" value={form.username} onChange={handleChange} placeholder="username (for login)" style={{ flex: 1, padding: 8 }} />
            <input name="email" value={form.email} onChange={handleChange} placeholder="email" style={{ flex: 1, padding: 8 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="password" style={{ flex: 1, padding: 8 }} />
            <select name="role" value={form.role} onChange={handleChange} style={{ padding: 8 , cursor: 'pointer'}}>
              <option value="employee">employee</option>
              <option value="employeeAdmin">employeeAdmin</option>
              <option value="hotelAdmin">hotelAdmin</option>
              <option value="restaurantAdmin">restaurantAdmin</option>
            </select>
            <select name="status" value={form.status} onChange={handleChange} style={{ padding: 8 , cursor: 'pointer' }}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            <label style={{ alignSelf: 'center', minWidth: 100 }}>Job Title</label>
            <select name="jobTitle" value={form.jobTitle} onChange={handleChange} style={{ padding: 8 , cursor: 'pointer' }}>
              <option value="Cleaner">Cleaner</option>
              <option value="Clerk">Clerk</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Manager">Manager</option>
              <option value="Staff">Staff</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={{ background: '#0b6bff', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6 , cursor: 'pointer'}}>Save</button>
            <button type="button" onClick={() => setShowAdd(false)} style={{ background: '#ddd', border: 'none', padding: '8px 16px', borderRadius: 6 , cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      )}

      <div style={{
        background: '#e5e5e5',
        borderRadius: 16,
        padding: 24,
        boxShadow: '2px 2px 8px #ddd',
        marginBottom: 24,
        width: '90%',
        maxWidth: 900
      }}>
        {loading ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: 24 }}>
            <div className="spinner" />
          </div>
        ) : (
        <table style={{ width: '100%', fontSize: 16, color: '#444', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', fontWeight: 600 }}>
              <th>ID</th>
              <th>Name</th>
              <th>Job Title</th>
              <th>Contact No.</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id} style={{ borderBottom: '1px solid #ccc' }}>
                <td>{emp.formattedId || emp.id}</td>
                <td>{emp.name}</td>
                <td>{emp.jobTitle}</td>
                <td>{emp.contact}</td>
                <td>{emp.status}</td>
                <td style={{ color: '#666', cursor: 'pointer' }} onClick={() => openModal(emp)}>View/Edit</td>
              </tr>
            ))}
            {[...Array(Math.max(0, 8 - employees.length))].map((_, i) => (
              <tr key={i + employees.length} style={{ height: 32 }}>
                <td colSpan={6}></td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
      {/* Modal for viewing/editing an employee */}
      {modalOpen && selectedEmployee && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', width: '90%', maxWidth: 720, borderRadius: 12, padding: 24, position: 'relative' }}>
            <button onClick={closeModal} style={{ position: 'absolute', right: 12, top: 12, border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer' }}>✕</button>
            <h3 style={{ marginTop: 0 }}>Employee Details</h3>
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ width: 120, height: 120, borderRadius: 8, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>◯</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{selectedEmployee.name}</div>
                <div style={{ color: '#777', marginBottom: 12 }}>{selectedEmployee.jobTitle}</div>
                <div style={{ marginTop: 8 }}><strong>ID:</strong> {selectedEmployee.formattedId || selectedEmployee.id}</div>
                <div style={{ marginTop: 6 }}><strong>Email:</strong> {selectedEmployee.email || '—'}</div>
                <div style={{ marginTop: 6 }}><strong>Contact:</strong> {selectedEmployee.contact || '—'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 18 }}>
              <button onClick={closeModal} style={{ background: '#ddd', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>Close</button>
              <button onClick={() => deleteEmployee(selectedEmployee)} style={{ background: '#b00020', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



// Attendance Section
function AttendanceSection() {
  const [emps, setEmps] = useState([]);

  useEffect(() => {
    let mounted = true;
    fetchEmployeesBasic().then(list => { if (mounted) setEmps(list); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  // small fake logs using actual employees (one per employee)
  const logs = emps.map((e, idx) => ({
    date: new Date().toLocaleDateString(),
    employee: `${e.name} (${e.formattedId})`,
    timeIn: '7:30 AM',
    timeOut: '3:30 PM',
    hours: '8Hrs',
    status: 'View/Edit'
  }));

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Attendance</h2>
      <div style={{ marginBottom: 12, fontWeight: 500 }}>Attendance Logs</div>
      <div style={{
        background: '#e5e5e5',
        borderRadius: 16,
        padding: 24,
        boxShadow: '2px 2px 8px #ddd',
        marginBottom: 24,
        width: '90%',
        maxWidth: 900
      }}>
        <table style={{ width: '100%', fontSize: 16, color: '#444', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', fontWeight: 600 }}>
              <th>Date</th>
              <th>Employee</th>
              <th>Time-In</th>
              <th>Time-Out</th>
              <th>Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #ccc' }}>
                <td>{log.date}</td>
                <td>{log.employee}</td>
                <td>{log.timeIn}</td>
                <td>{log.timeOut}</td>
                <td>{log.hours}</td>
                <td style={{ color: '#666', cursor: 'pointer' }}>{log.status}</td>
              </tr>
            ))}
            {[...Array(Math.max(0, 8 - logs.length))].map((_, i) => (
              <tr key={i + logs.length} style={{ height: 32 }}>
                <td colSpan={6}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button style={{
        background: '#888',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        padding: '10px 24px',
        fontWeight: 600,
        fontSize: 16,
        cursor: 'pointer',
        marginRight: 16
      }}>
        Filter By Date
      </button>
      <button style={{
        background: '#888',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        padding: '10px 24px',
        fontWeight: 600,
        fontSize: 16,
        cursor: 'pointer'
      }}>
        Export Report
      </button>
    </div>
  );
}

function PayrollSection() {
  const [emps, setEmps] = useState([]);

  useEffect(() => {
    let mounted = true;
    fetchEmployeesBasic().then(list => { if (mounted) setEmps(list); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const payrolls = emps.slice(0, 6).map((e, idx) => ({
    id: e.formattedId,
    employee: e.name,
    periodStart: '8/01/2025',
    periodEnd: '8/31/2025',
    amount: '15,000',
    status: idx % 2 === 0 ? 'Paid' : 'Unpaid',
    action: idx % 2 === 0 ? 'View' : 'Pay'
  }));

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Payroll</h2>
      <div style={{ marginBottom: 12, fontWeight: 500 }}>Payroll Record</div>
      <div style={{
        background: '#e5e5e5',
        borderRadius: 16,
        padding: 24,
        boxShadow: '2px 2px 8px #ddd',
        marginBottom: 24,
        width: '90%',
        maxWidth: 900
      }}>
        <table style={{ width: '100%', fontSize: 16, color: '#444', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', fontWeight: 600 }}>
              <th>ID</th>
              <th>Employee</th>
              <th>Period Start</th>
              <th>Period End</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {payrolls.map((p, idx) => (
              <tr key={p.id || idx} style={{ borderBottom: '1px solid #ccc' }}>
                <td>{p.id}</td>
                <td>{p.employee}</td>
                <td>{p.periodStart}</td>
                <td>{p.periodEnd}</td>
                <td>{p.amount}</td>
                <td>
                  <span style={{
                    color: p.status === 'Paid' ? '#888' : '#666',
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}>
                    {p.status}
                  </span>
                </td>
                <td style={{ color: '#666', cursor: 'pointer' }}>{p.action}</td>
              </tr>
            ))}
            {[...Array(Math.max(0, 8 - payrolls.length))].map((_, i) => (
              <tr key={i + payrolls.length} style={{ height: 32 }}>
                <td colSpan={7}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button style={{
        background: '#888',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        padding: '10px 24px',
        fontWeight: 600,
        fontSize: 16,
        cursor: 'pointer',
        marginRight: 16
      }}>
        Generate Payroll
      </button>
      <button style={{
        background: '#888',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        padding: '10px 24px',
        fontWeight: 600,
        fontSize: 16,
        cursor: 'pointer'
      }}>
        Export
      </button>
    </div>
  );
}

function TasksSection() {
  const [emps, setEmps] = useState([]);

  useEffect(() => {
    let mounted = true;
    fetchEmployeesBasic().then(list => { if (mounted) setEmps(list); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const tasks = emps.slice(0, 7).map((e, idx) => ({ id: e.formattedId, assigned: e.name, room: `${500 + idx}`, type: 'CLEANING', location: 'BLDG A' }));

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Tasks</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <button style={taskBtnStyle()}><span role="img" aria-label="calendar">📅</span> DATE</button>
        <button style={taskBtnStyle()}><span role="img" aria-label="filter">☰</span> FILTER</button>
        <button style={taskBtnStyle()}><span style={{ marginRight: 8 }}>◯</span>UNASSIGNED</button>
        <button style={taskBtnStyle()}><span style={{ marginRight: 8 }}>◯</span>NOT STARTED</button>
      </div>
      <div style={{
        background: '#e5e5e5',
        borderRadius: 16,
        padding: 0,
        boxShadow: '2px 2px 8px #ddd',
        marginBottom: 24,
        width: '100%',
        maxWidth: 1100
      }}>
        <table style={{ width: '100%', fontSize: 16, color: '#444', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', fontWeight: 600, background: '#e5e5e5' }}>
              <th style={{ padding: '18px 0 18px 24px' }}>TASK ID</th>
              <th>ASSIGNED TO <span style={{ fontWeight: 400 }}>▼</span></th>
              <th>ROOM</th>
              <th>TASK TYPE</th>
              <th>LOCATION</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, idx) => (
              <tr key={idx} style={{
                background: '#f5f5f5',
                borderBottom: '1px solid #e0e0e0',
                height: 48
              }}>
                <td style={{ paddingLeft: 24 }}>{task.id}</td>
                <td>{task.assigned}</td>
                <td>{task.room}</td>
                <td>{task.type}</td>
                <td>{task.location}</td>
              </tr>
            ))}
            {[...Array(Math.max(0, 8 - tasks.length))].map((_, i) => (
              <tr key={i + tasks.length} style={{ height: 48, background: '#f5f5f5' }}>
                <td colSpan={5}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function taskBtnStyle() {
  return {
    background: '#fff',
    color: '#444',
    border: 'none',
    borderRadius: 8,
    padding: '12px 32px',
    fontWeight: 600,
    fontSize: 16,
    boxShadow: '0 2px 6px #ddd',
    cursor: 'pointer'
  };
}

function RoomAssignmentSection() {
  const [emps, setEmps] = useState([]);

  useEffect(() => {
    let mounted = true;
    fetchEmployeesBasic().then(list => { if (mounted) setEmps(list); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const assignments = emps.slice(0, 7).map((e, idx) => ({ roomId: `${500 + idx}`, assigned: e.name, room: `${500 + idx}`, type: 'CLEANING', location: 'BLDG A', action: 'REASSIGNED' }));

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Room Assignments</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <button style={taskBtnStyle()}><span role="img" aria-label="calendar">📅</span> DATE</button>
        <button style={taskBtnStyle()}><span role="img" aria-label="filter">☰</span> FILTER</button>
        <button style={taskBtnStyle()}><span style={{ marginRight: 8 }}>◯</span>UNASSIGNED</button>
        <button style={taskBtnStyle()}><span style={{ marginRight: 8 }}>◯</span>NOT STARTED</button>
      </div>
      <div style={{
        background: '#e5e5e5',
        borderRadius: 16,
        padding: 0,
        boxShadow: '2px 2px 8px #ddd',
        marginBottom: 24,
        width: '100%',
        maxWidth: 1100
      }}>
        <table style={{ width: '100%', fontSize: 16, color: '#444', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', fontWeight: 600, background: '#e5e5e5' }}>
              <th style={{ padding: '18px 0 18px 24px' }}>ROOM ID</th>
              <th>ASSIGNED TO <span style={{ fontWeight: 400 }}>▼</span></th>
              <th>ROOM</th>
              <th>TASK TYPE</th>
              <th>LOCATION</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((item, idx) => (
              <tr key={idx} style={{
                background: '#f5f5f5',
                borderBottom: '1px solid #e0e0e0',
                height: 48
              }}>
                <td style={{ paddingLeft: 24 }}>{item.roomId}</td>
                <td>{item.assigned}</td>
                <td>{item.room}</td>
                <td>{item.type}</td>
                <td>{item.location}</td>
                <td style={{
                  fontWeight: 700,
                  color: '#888',
                  textShadow: '2px 2px 4px #bbb',
                  letterSpacing: 1
                }}>{item.action}</td>
              </tr>
            ))}
            {[...Array(Math.max(0, 8 - assignments.length))].map((_, i) => (
              <tr key={i + assignments.length} style={{ height: 48, background: '#f5f5f5' }}>
                <td colSpan={6}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Card component
function Card({ title, value, children }) {
  return (
    <div style={{
      background: '#e5e5e5',
      borderRadius: 12,
      padding: 24,
      minHeight: 120,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      marginBottom: 0
    }}>
      <div style={{ fontWeight: 600, marginBottom: 12 }}>{title}</div>
      {value && <div style={{ fontSize: 32, fontWeight: 700 }}>{value}</div>}
      {children}
    </div>
  );
}

// PieChart placeholder
function PieChart() {
  return (
    <svg width="80" height="80">
      <circle cx="40" cy="40" r="35" fill="#ccc" />
      <path d="M40,40 L40,5 A35,35 0 0,1 75,40 Z" fill="#888" />
    </svg>
  );
}

// BarChart placeholder
function BarChart() {
  return (
    <svg width="120" height="60">
      <rect x="10" y="20" width="20" height="30" fill="#aaa" />
      <rect x="40" y="40" width="20" height="10" fill="#aaa" />
      <rect x="70" y="30" width="20" height="20" fill="#aaa" />
      <rect x="100" y="10" width="20" height="40" fill="#aaa" />
    </svg>
  );
}


// Sidebar button style
// navBtnStyle removed — sidebar buttons now use the `.sidebar-btn` CSS class and `.active` modifier

export default EmployeeAdminDashboard;