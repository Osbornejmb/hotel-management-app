import React, { useState, useEffect } from "react";

// Helper: fetch total employees
async function fetchTotalEmployees() {
  try {
    const res = await fetch("/api/employee");
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
    const res = await fetch("/api/attendances");
    if (!res.ok) return 0;
    const data = await res.json();
    const today = new Date().toDateString();
    const presentToday = data.filter((att) => new Date(att.date).toDateString() === today && att.clockIn);
    return presentToday.length;
  } catch (err) {
    console.error("fetchPresentToday error", err);
    return 0;
  }
}

// Helper: fetch payroll status
async function fetchPayrollStatus() {
  try {
    const res = await fetch("/api/payrolls");
    if (!res.ok) return { paid: 0, unpaid: 0, total: 0 };
    const data = await res.json();
    const paid = data.filter((p) => p.status === "Paid").length;
    const unpaid = data.filter((p) => p.status === "Unpaid").length;
    const total = data.reduce((sum, p) => sum + (p.amount || 0), 0);
    return { paid, unpaid, total };
  } catch (err) {
    console.error("fetchPayrollStatus error", err);
    return { paid: 0, unpaid: 0, total: 0 };
  }
}

// Helper: fetch pending tasks
async function fetchPendingTasks() {
  try {
    const res = await fetch("/api/tasks");
    if (!res.ok) return 0;
    const data = await res.json();
    const pending = data.filter((task) => task.status === "pending" || task.status === "Pending");
    return pending.length;
  } catch (err) {
    console.error("fetchPendingTasks error", err);
    return 0;
  }
}

// Helper: fetch recent logs
async function fetchRecentLogs() {
  try {
    const res = await fetch("/api/attendances");
    if (!res.ok) return [];
    const data = await res.json();
    return data.slice(0, 5).map((log) => ({
      employee: log.employeeName,
      timeIn: new Date(log.clockIn).toLocaleTimeString(),
      timeOut: new Date(log.clockOut).toLocaleTimeString(),
      date: new Date(log.date).toLocaleDateString(),
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

  useEffect(() => {
    fetchTotalEmployees().then(setTotalEmployees).catch(() => {});
    fetchPresentToday().then(setPresentToday).catch(() => {});
    fetchPayrollStatus().then(setPayrollStatus).catch(() => {});
    fetchRecentLogs().then(setRecentLogs).catch(() => {});
    fetchPendingTasks().then(setPendingTasks).catch(() => {});
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
          <BarChart />
        </Card>
      </div>
    </div>
  );
};

export default DashboardSection;
