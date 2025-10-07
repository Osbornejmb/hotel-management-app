
import React, { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);


function Dashboard() {
  // Dummy values for panels (replace with real data if needed)
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [ongoingHousekeeping, setOngoingHousekeeping] = useState(0);
  const [ongoingMaintenance, setOngoingMaintenance] = useState(0);
  const [monthlyCounts, setMonthlyCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roomTypeCounts, setRoomTypeCounts] = useState({});

  useEffect(() => {
  async function fetchBookingsAndTasks() {
      try {
        // Fetch bookings
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/bookings`);
        if (!res.ok) throw new Error('Failed to fetch bookings');
        const data = await res.json();
        // Aggregate bookings by month using booking.checkInDate
        const counts = Array(12).fill(0);
        data.forEach(b => {
          const dateStr = b.checkInDate || b.checkIn || b.checkinDate || b.bookedAt;
          if (dateStr) {
            const d = new Date(dateStr);
            if (!isNaN(d)) counts[d.getMonth()]++;
          }
        });
        setMonthlyCounts(counts);

        // Fetch rooms and compute occupied-room stats from room.status
        const roomsRes = await fetch(`${process.env.REACT_APP_API_URL}/api/rooms`);
        if (!roomsRes.ok) throw new Error('Failed to fetch rooms');
        const roomsData = await roomsRes.json();
        // Occupied rooms: consider several possible indicators
        const occupiedStatuses = new Set(['booked', 'booked ', 'checked in', 'checked_in', 'checked-in', 'occupied', 'in use']);
        const occupiedRooms = roomsData.filter(r => {
          const status = (r.status || '').toString().trim().toLowerCase();
          // if guestName exists, treat as occupied as well
          const hasGuest = !!(r.guestName || r.guestname || r.guest);
          return occupiedStatuses.has(status) || hasGuest;
        });
        setCheckedInCount(occupiedRooms.length);

        // Normalize room type values to canonical labels
        function normalizeRoomType(raw) {
          if (!raw) return 'Unknown';
          const s = raw.toString().trim().toLowerCase();
          if (s.includes('president')) return 'Presidential';
          if (s.includes('suite')) return 'Suite';
          if (s.includes('deluxe')) return 'Deluxe';
          if (s.includes('econom') || s.includes('standard')) return 'Economy';
          return raw.toString();
        }

        const typeCounts = {};
        occupiedRooms.forEach(room => {
          const type = normalizeRoomType(room.roomType);
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        setRoomTypeCounts(typeCounts);

        // Debug: log fetched rooms and computed counts so you can inspect in browser console
        console.debug('roomsData (fetched):', roomsData);
        console.debug('occupiedRooms (detected):', occupiedRooms);
        console.debug('roomTypeCounts (computed):', typeCounts);

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

  // pieData and pieOptions are computed in component scope below
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
    maintainAspectRatio: false,
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

  // Pie chart data for room type usage (computed from roomTypeCounts state)
  const pieData = {
    labels: Object.keys(roomTypeCounts),
    datasets: [
      {
        data: Object.values(roomTypeCounts),
        backgroundColor: [
          '#b48a2c', '#e0c36e', '#8a6d3b', '#f5e6c4', '#c0a16b', '#e6b800', '#b4b4b4', '#a3c9a8', '#f7cac9', '#92a8d1'
        ],
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      title: { display: true, text: 'Room Type Usage (Occupied Rooms)' },
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
          <div className="dashboard-analytics-grid">
            <div className="chart-panel bar">
              <Bar data={chartData} options={chartOptions} />
            </div>
            <div className="chart-panel pie">
              <Pie data={pieData} options={pieOptions} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
