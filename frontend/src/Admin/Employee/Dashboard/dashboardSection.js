import React, { useState, useEffect } from "react";

// Helper: fetch total employees
async function fetchTotalEmployees() {
  try {
    const apiBase = process.env.REACT_APP_API_URL || 'https://hotel-management-app-qo2l.onrender.com';
    const res = await fetch(`${apiBase}/api/employee`);
    if (!res.ok) return 0;
    const data = await res.json();
    return Array.isArray(data) ? data.length : 0;
  } catch (err) {
    console.error("fetchTotalEmployees error", err);
    return 0;
  }
}

// Helper: fetch present employees today
async function fetchPresentToday() {
  try {
    const apiBase = process.env.REACT_APP_API_URL || 'https://hotel-management-app-qo2l.onrender.com';
    const res = await fetch(`${apiBase}/api/attendances`);
    if (!res.ok) return 0;
    const data = await res.json();
    
    // Use consistent date format (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    
    // Filter for employees still clocked in today (no clockOut or clockOut is null)
    const presentToday = data.filter((att) => {
      const attDate = att.date; // Already in YYYY-MM-DD format from backend
      const isToday = attDate === today;
      const isStillPresent = !att.clockOut || att.clockOut === null;
      return isToday && isStillPresent;
    });
    
    console.log('Present today count:', presentToday.length, 'from', data.length, 'total records');
    return presentToday.length;
  } catch (err) {
    console.error("fetchPresentToday error", err);
    return 0;
  }
}

// Helper: fetch payroll status with real data
async function fetchPayrollStatus() {
  try {
    const apiBase = process.env.REACT_APP_API_URL || 'https://hotel-management-app-qo2l.onrender.com';
    
    // Fetch attendance records to calculate real payroll
    const res = await fetch(`${apiBase}/api/attendances`);
    if (res.ok) {
      const attendanceData = await res.json();
      if (Array.isArray(attendanceData) && attendanceData.length > 0) {
        // Group by employee and sum hours
        const employeeMap = {};
        attendanceData.forEach(record => {
          if (!record.cardId) return;
          if (!employeeMap[record.cardId]) {
            employeeMap[record.cardId] = { totalHours: 0 };
          }
          employeeMap[record.cardId].totalHours += record.totalHours || 0;
        });
        
        const hourlyRate = 95; // PHP per hour
        const employees = Object.values(employeeMap);
        const total = employees.reduce((sum, emp) => sum + (emp.totalHours * hourlyRate), 0);
        
        // Assume all are unpaid initially (you can modify this logic based on your requirements)
        const unpaid = employees.length;
        const paid = 0;
        
        console.log('Payroll data:', { paid, unpaid, total, count: employees.length });
        return { paid, unpaid, total };
      }
    }
    
    return { paid: 0, unpaid: 0, total: 0 };
  } catch (err) {
    console.error("fetchPayrollStatus error", err);
    return { paid: 0, unpaid: 0, total: 0 };
  }
}

// Helper: fetch pending tasks - only unassigned tasks
async function fetchPendingTasks() {
  try {
    const apiBase = process.env.REACT_APP_API_URL || 'https://hotel-management-app-qo2l.onrender.com';
    
    // Fetch tasks endpoint and count only UNASSIGNED tasks
    const res = await fetch(`${apiBase}/api/tasks`);
    if (res.ok) {
      const data = await res.json();
      // Count only unassigned tasks
      const unassigned = data.filter((task) => task.status === "UNASSIGNED");
      console.log('Unassigned tasks:', unassigned.length);
      return unassigned.length;
    }
    
    return 0;
  } catch (err) {
    console.error("fetchPendingTasks error", err);
    return 0;
  }
}

// Helper: fetch task completion analytics
async function fetchTaskCompletionAnalytics() {
  try {
    const apiBase = process.env.REACT_APP_API_URL || 'https://hotel-management-app-qo2l.onrender.com';
    const res = await fetch(`${apiBase}/api/tasks`);
    if (res.ok) {
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        return { completed: 0, total: 0, percentage: 0 };
      }
      
      const completed = data.filter((task) => task.status === "COMPLETED").length;
      const total = data.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      console.log('Task completion:', { completed, total, percentage });
      return { completed, total, percentage };
    }
    
    return { completed: 0, total: 0, percentage: 0 };
  } catch (err) {
    console.error("fetchTaskCompletionAnalytics error", err);
    return { completed: 0, total: 0, percentage: 0 };
  }
}

// Helper: fetch recent logs
async function fetchRecentLogs() {
  try {
    const apiBase = process.env.REACT_APP_API_URL || 'https://hotel-management-app-qo2l.onrender.com';
    const res = await fetch(`${apiBase}/api/attendances`);
    if (!res.ok) return [];
    const data = await res.json();
    
    // Filter out records with missing data and format properly
    return data
      .filter(log => log.name && log.clockIn)
      .slice(0, 10)
      .map((log) => ({
        employee: log.name || log.employeeName || 'Unknown',
        timeIn: log.clockIn ? new Date(log.clockIn).toLocaleTimeString() : '—',
        timeOut: log.clockOut ? new Date(log.clockOut).toLocaleTimeString() : '—',
        date: log.date || 'Unknown',
      }));
  } catch (err) {
    console.error("fetchRecentLogs error", err);
    return [];
  }
}

// Card component
const Card = ({ title, value, children }) => {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 24,
        minHeight: 160,
        display: "flex",
        flexDirection: "column",
        alignItems: "center", // center horizontally
        justifyContent: "center", // center vertically
        textAlign: "center",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
      }}
    >
      <div
        style={{
          fontWeight: 600,
          marginBottom: value || children ? 12 : 0,
          color: "#2c3e50",
          fontSize: 16,
        }}
      >
        {title}
      </div>
      {value && (
        <div style={{ fontSize: 36, fontWeight: 700, color: "#34495e" }}>
          {value}
        </div>
      )}
      {children}
    </div>
  );
};

// PieChart placeholder
const PieChart = () => {
  return (
    <svg width="100" height="100">
      <circle cx="50" cy="50" r="45" fill="#e5e7eb" />
      <path d="M50,50 L50,5 A45,45 0 0,1 95,50 Z" fill="#38bdf8" />
    </svg>
  );
};

// BarChart placeholder
const BarChart = () => {
  return (
    <svg width="140" height="80">
      <rect x="10" y="40" width="20" height="30" fill="#60a5fa" />
      <rect x="40" y="20" width="20" height="50" fill="#3b82f6" />
      <rect x="70" y="30" width="20" height="40" fill="#2563eb" />
      <rect x="100" y="10" width="20" height="60" fill="#1d4ed8" />
    </svg>
  );
};

// Dashboard Section Component
const DashboardSection = () => {
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [presentToday, setPresentToday] = useState(0);
  const [payrollStatus, setPayrollStatus] = useState({ paid: 0, unpaid: 0, total: 0 });
  const [recentLogs, setRecentLogs] = useState([]);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [taskCompletion, setTaskCompletion] = useState({ completed: 0, total: 0, percentage: 0 });

  useEffect(() => {
    fetchTotalEmployees().then(setTotalEmployees).catch(() => {});
    fetchPresentToday().then(setPresentToday).catch(() => {});
    fetchPayrollStatus().then(setPayrollStatus).catch(() => {});
    fetchRecentLogs().then(setRecentLogs).catch(() => {});
    fetchPendingTasks().then(setPendingTasks).catch(() => {});
    fetchTaskCompletionAnalytics().then(setTaskCompletion).catch(() => {});
  }, []);

  return (
    <div style={{ padding: 32, background: "#f8fafc", minHeight: "100vh" }}>
      <h2
        style={{
          marginBottom: 32,
          color: "#1e293b",
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        Dashboard
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
        }}
      >
        <Card title="Total Employees" value={totalEmployees} />
        <Card title="Present Today" value={presentToday} />
        <Card title="Payroll Status">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <PieChart />
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 8,
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: "#38bdf8",
                    display: "inline-block",
                    marginRight: 8,
                  }}
                />
                Paid: {payrollStatus.paid}
              </div>
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: "#e5e7eb",
                    display: "inline-block",
                    marginRight: 8,
                  }}
                />
                Unpaid: {payrollStatus.unpaid}
              </div>
            </div>
          </div>
        </Card>
        <Card title="Total Payroll" value={`₱${payrollStatus.total.toLocaleString()}`} />
        <Card title="Pending Tasks" value={pendingTasks} />
        <Card title="Recent Logs">
          <table
            style={{
              width: "100%",
              fontSize: 14,
              color: "#334155",
              marginTop: 8,
              borderCollapse: "separate",
              borderSpacing: "0 6px",
            }}
          >
            <thead>
              <tr style={{ textAlign: "center", color: "#475569" }}>
                <th>Employee</th>
                <th>Time-in</th>
                <th>Time-Out</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map((log, i) => (
                <tr
                  key={i}
                  style={{ background: i % 2 === 0 ? "#f1f5f9" : "#fff" }}
                >
                  <td style={{ padding: "8px", textAlign: "center" }}>{log.employee}</td>
                  <td style={{ textAlign: "center" }}>{log.timeIn}</td>
                  <td style={{ textAlign: "center" }}>{log.timeOut}</td>
                  <td style={{ textAlign: "center" }}>{log.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Task Completion Rate">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg width="100" height="100">
              {/* Outer circle background */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              {/* Progress circle */}
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                fill="none" 
                stroke="#38bdf8" 
                strokeWidth="8"
                strokeDasharray={`${(taskCompletion.percentage / 100) * 251.2} 251.2`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
              {/* Percentage text */}
              <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="700" fill="#2c3e50">
                {taskCompletion.percentage}%
              </text>
            </svg>
            <div>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 8, justifyContent: "center", gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#38bdf8", display: "inline-block" }} />
                Completed: {taskCompletion.completed}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#e5e7eb", display: "inline-block" }} />
                Total: {taskCompletion.total}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardSection;
