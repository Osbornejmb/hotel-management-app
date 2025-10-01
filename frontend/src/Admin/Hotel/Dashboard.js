
import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);


function Dashboard() {
  // Dummy values for panels (replace with real data if needed)
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [ongoingHousekeeping, setOngoingHousekeeping] = useState(0);
  const [ongoingMaintenance, setOngoingMaintenance] = useState(0);
  const [monthlyCounts, setMonthlyCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchBookingsAndTasks() {
      try {
        // Fetch bookings
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/bookings`);
        if (!res.ok) throw new Error('Failed to fetch bookings');
        const data = await res.json();
        // Aggregate bookings by month
        const counts = Array(12).fill(0);
        let checkedIn = 0;
        data.forEach(b => {
          if (b.checkIn) {
            const d = new Date(b.checkIn);
            if (!isNaN(d)) {
              counts[d.getMonth()]++;
            }
          }
          if (b.status && b.status.toLowerCase() === 'checked in') {
            checkedIn++;
          }
        });
        setMonthlyCounts(counts);
        setCheckedInCount(checkedIn);

        // Fetch tasks for housekeeping/maintenance
        const taskRes = await fetch(`${process.env.REACT_APP_API_URL}/api/tasks`);
        if (!taskRes.ok) throw new Error('Failed to fetch tasks');
        const tasksData = await taskRes.json();
        // Housekeeping: type CLEANING, status NOT_STARTED or UNDER CLEANING
        // Maintenance: type MAINTENANCE, status NOT_STARTED or UNDER MAINTENANCE
        let housekeepingCount = 0;
        let maintenanceCount = 0;
        tasksData.forEach(t => {
          if (t.type && t.status) {
            const typeNorm = t.type.toUpperCase();
            const statusNorm = t.status.replace(/\s+/g, '_').toUpperCase();
            if (typeNorm === 'CLEANING' && (statusNorm === 'NOT_STARTED' || statusNorm === 'UNDER_CLEANING')) {
              housekeepingCount++;
            }
            if (typeNorm === 'MAINTENANCE' && (statusNorm === 'NOT_STARTED' || statusNorm === 'UNDER_MAINTENANCE')) {
              maintenanceCount++;
            }
          }
        });
        setOngoingHousekeeping(housekeepingCount);
        setOngoingMaintenance(maintenanceCount);
      } catch (err) {
        setError('Could not load booking stats.');
      } finally {
        setLoading(false);
      }
    }
    fetchBookingsAndTasks();
  }, []);

  const chartData = {
    labels: [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ],
    datasets: [
      {
        label: 'Bookings',
        data: monthlyCounts,
        backgroundColor: '#b48a2c',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Monthly Booking Count' },
    },
    scales: {
      y: {
        beginAtZero: true,
        precision: 0,
        ticks: {
          stepSize: 10,
          color: '#333',
        },
        grid: {
          color: '#ccc',
        },
      },
      x: {
        grid: {
          color: '#eee',
        },
        ticks: {
          color: '#333',
        },
      },
    },
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome to the Dashboard</h1>
      {/* Summary Panels */}
      <div className="dashboard-summary-panels">
        <div className="dashboard-summary-panel">
          <div className="dashboard-summary-panel-icon">🛏️</div>
          <div className="dashboard-summary-panel-value">{checkedInCount}</div>
          <div className="dashboard-summary-panel-label">Checked In</div>
        </div>
        <div className="dashboard-summary-panel">
          <div className="dashboard-summary-panel-icon">🧹</div>
          <div className="dashboard-summary-panel-value">{ongoingHousekeeping}</div>
          <div className="dashboard-summary-panel-label">Ongoing Housekeeping</div>
        </div>
        <div className="dashboard-summary-panel">
          <div className="dashboard-summary-panel-icon">🛠️</div>
          <div className="dashboard-summary-panel-value">{ongoingMaintenance}</div>
          <div className="dashboard-summary-panel-label">Ongoing Maintenance</div>
        </div>
      </div>
      {/* Booking Analytics */}
      <div className="dashboard-analytics-container">
        {loading ? (
          <div>Loading booking stats...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : (
          <Bar data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
