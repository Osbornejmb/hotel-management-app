import React, { useState } from 'react';
import LogoutButton from '../../Auth/LogoutButton';

const sections = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'employee', label: 'Employee Management' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'payroll', label: 'Payroll' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'room', label: 'Room Assignment' },
];

function EmployeeAdminDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f7f7' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: '#fff',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRight: '1px solid #eee',
        position: 'relative'
      }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#eaeaea', marginBottom: 16 }} />
        <div style={{ fontWeight: 600, fontSize: 18 }}>Dostoevsky</div>
        <div style={{ color: '#888', marginBottom: 32 }}>Admin</div>
        <nav style={{ width: '100%' }}>
          {sections.map(sec => (
            <button
              key={sec.key}
              style={navBtnStyle(activeSection === sec.key)}
              onClick={() => setActiveSection(sec.key)}
            >
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
          <LogoutButton />
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
      </main>
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
  const employees = [
    { id: '0101', name: 'James Henessy', job: 'Manager', contact: '091******43', status: 'ACTIVE' },
    { id: '0102', name: 'Mckenzie Summers', job: 'Clerk', contact: '091******43', status: 'ACTIVE' },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Employee Management</h2>
      <div style={{ marginBottom: 12, fontWeight: 500 }}>Employee Table</div>
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
              <th>Name</th>
              <th>Job</th>
              <th>Contact No.</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id} style={{ borderBottom: '1px solid #ccc' }}>
                <td>{emp.id}</td>
                <td>{emp.name}</td>
                <td>{emp.job}</td>
                <td>{emp.contact}</td>
                <td>{emp.status}</td>
                <td style={{ color: '#666', cursor: 'pointer' }}>View/Edit</td>
              </tr>
            ))}
            {[...Array(8 - employees.length)].map((_, i) => (
              <tr key={i + employees.length} style={{ height: 32 }}>
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
        cursor: 'pointer'
      }}>
        + Add Employee
      </button>
    </div>
  );
}

// Attendance Section
function AttendanceSection() {
  const logs = [
    { date: '01/02/2058', employee: 'James Henessy', timeIn: '7:30 AM', timeOut: '3:30PM', hours: '8Hrs', status: 'View/Edit' },
    { date: '01/02/2058', employee: 'Mckenzie Summers', timeIn: '7:55 AM', timeOut: '3:30PM', hours: '7hrs 35 Min', status: 'View/Edit' },
  ];

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
            {[...Array(8 - logs.length)].map((_, i) => (
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
  const payrolls = [
    {
      id: '0101',
      employee: 'James Henessy',
      periodStart: '8/01/2025',
      periodEnd: '8/31/2025',
      amount: '15,000',
      status: 'Paid',
      action: 'View'
    },
    {
      id: '0102',
      employee: 'Mckenzie Summers',
      periodStart: '8/01/2025',
      periodEnd: '8/31/2025',
      amount: '15,000',
      status: 'Unpaid',
      action: 'Pay'
    }
  ];

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
              <tr key={p.id} style={{ borderBottom: '1px solid #ccc' }}>
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
            {[...Array(8 - payrolls.length)].map((_, i) => (
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
  const tasks = [
    { id: '01', assigned: 'SAM SMITH', room: '504', type: 'CLEANING', location: 'BLDG A' },
    { id: '01', assigned: 'SAM SMITH', room: '504', type: 'CLEANING', location: 'BLDG A' },
    { id: '01', assigned: 'SAM SMITH', room: '504', type: 'CLEANING', location: 'BLDG A' },
    { id: '01', assigned: 'SAM SMITH', room: '504', type: 'CLEANING', location: 'BLDG A' },
    { id: '01', assigned: 'SAM SMITH', room: '504', type: 'CLEANING', location: 'BLDG A' },
    { id: '01', assigned: 'SAM SMITH', room: '504', type: 'CLEANING', location: 'BLDG A' },
    { id: '01', assigned: 'SAM SMITH', room: '504', type: 'CLEANING', location: 'BLDG A' },
  ];

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
            {[...Array(8 - tasks.length)].map((_, i) => (
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
  const assignments = [
    { roomId: '504', assigned: 'SAM SMITH', room: '504', type: 'CLEANING', location: 'BLDG A', action: 'REASSIGNED' },
    { roomId: '505', assigned: 'SAM SMITH', room: '504', type: 'CLEANING', location: 'BLDG A', action: 'REASSIGNED' },
    { roomId: '124', assigned: 'SAM SMITH', room: '504', type: 'CLEANING', location: 'BLDG A', action: 'REASSIGNED' },
    { roomId: '123', assigned: 'SAM SMITH', room: '504', type: 'CLEANING', location: 'BLDG A', action: 'REASSIGNED' },
    { roomId: '123', assigned: 'SAM SMITH', room: '504', type: 'CLEANING', location: 'BLDG A', action: 'REASSIGNED' },
    { roomId: '435', assigned: 'SAM SMITH', room: '504', type: 'CLEANING', location: 'BLDG A', action: 'REASSIGNED' },
    { roomId: '031', assigned: 'SAM SMITH', room: '504', type: 'CLEANING', location: 'BLDG A', action: 'REASSIGNED' },
  ];

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
            {[...Array(8 - assignments.length)].map((_, i) => (
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
function navBtnStyle(active) {
  return {
    width: '100%',
    padding: '10px 0',
    marginBottom: 12,
    background: active ? '#d1d1d1' : '#f5f5f5',
    border: 'none',
    borderRadius: 8,
    fontWeight: active ? 700 : 500,
    color: '#333',
    textAlign: 'left',
    cursor: 'pointer'
  };
}

export default EmployeeAdminDashboard;