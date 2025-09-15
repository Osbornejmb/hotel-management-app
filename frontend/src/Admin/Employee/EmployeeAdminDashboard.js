import React from 'react';
import LogoutButton from '../../Auth/LogoutButton';

function EmployeeAdminDashboard() {
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
          <button style={navBtnStyle(true)}>Dashboard</button>
          <button style={navBtnStyle(false)}>Employee Management</button>
          <button style={navBtnStyle(false)}>Attendance</button>
          <button style={navBtnStyle(false)}>Payroll</button>
          <button style={navBtnStyle(false)}>Tasks</button>
          <button style={navBtnStyle(false)}>Room Assignment</button>
        </nav>
        {/* Logout button at the bottom left */}
        <div style={{
          position: 'absolute',
          left: 24,
          bottom: 24,
          width: 'calc(100% - 48px)'
        }}>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Dashboard */}
      <main style={{ flex: 1, padding: 40 }}>
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
      </main>
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