import React from "react";

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
        <Card title="Total Employees" value="24" />
        <Card title="Present Today" value="19" />
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
                Paid
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
                Unpaid
              </div>
            </div>
          </div>
        </Card>
        <Card title="Total Payroll" value="₱260,000" />
        <Card title="Pending Tasks" value="21" />
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
              {[...Array(5)].map((_, i) => (
                <tr
                  key={i}
                  style={{ background: i % 2 === 0 ? "#f1f5f9" : "#fff" }}
                >
                  <td style={{ padding: "8px", textAlign: "center" }}>—</td>
                  <td style={{ textAlign: "center" }}>—</td>
                  <td style={{ textAlign: "center" }}>—</td>
                  <td style={{ textAlign: "center" }}>—</td>
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
