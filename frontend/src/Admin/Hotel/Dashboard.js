
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
  const [bookingsData, setBookingsData] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roomTypeCounts, setRoomTypeCounts] = useState({});
  const [roomsData, setRoomsData] = useState([]);

  useEffect(() => {
  async function fetchBookingsAndTasks() {
      try {
        // Fetch bookings
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/bookings`);
        if (!res.ok) throw new Error('Failed to fetch bookings');
        const data = await res.json();
        // store raw bookings so chart filters can be applied
        setBookingsData(data || []);

        // discover available years from bookings
        const yearsSet = new Set();
        (data || []).forEach(b => {
          const dateStr = b.checkInDate || b.checkIn || b.checkinDate || b.bookedAt;
          if (dateStr) {
            const d = new Date(dateStr);
            if (!isNaN(d)) yearsSet.add(d.getFullYear());
          }
        });
        const yearsArr = Array.from(yearsSet).sort((a, b) => b - a);
        setAvailableYears(yearsArr);
        // default to current year if present, otherwise All
        const currentYear = new Date().getFullYear();
        setSelectedYear(yearsArr.includes(currentYear) ? currentYear.toString() : 'All');

        // Fetch rooms and compute occupied-room stats from room.status
        const roomsRes = await fetch(`${process.env.REACT_APP_API_URL}/api/rooms`);
        if (!roomsRes.ok) throw new Error('Failed to fetch rooms');
  const roomsDataRaw = await roomsRes.json();
  const roomsData = Array.isArray(roomsDataRaw) ? roomsDataRaw : roomsDataRaw.rooms || [];
  setRoomsData(roomsData);
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

  // Debug logging removed to reduce console clutter in production

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

  // Derived report metrics
  const totalRooms = roomsData.length || 0;
  const occupancyRate = totalRooms > 0 ? Math.round((checkedInCount / totalRooms) * 100) : 0;

  // Compute busiest months from monthlyCounts (when selectedMonth === 'All' monthlyCounts is 12 entries)
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const busiestMonths = (() => {
    if (!monthlyCounts || monthlyCounts.length === 0) return [];
    if (monthlyCounts.length < 12) {
      // if daily view or other, aggregate into single value
      const total = monthlyCounts.reduce((a,b)=>a+b,0);
      return [{ name: (selectedMonth === 'All' ? 'All' : `Month ${selectedMonth}`), count: total }];
    }
    const arr = monthlyCounts.map((c, i) => ({ name: monthNames[i], count: c }));
    arr.sort((a,b) => b.count - a.count);
    return arr.slice(0,3);
  })();

  // Generate AI-like suggestions (heuristics)
  const generateSuggestions = () => {
    const suggestions = [];
    // occupancy suggestions
    if (occupancyRate >= 85) {
      suggestions.push('High occupancy detected — consider dynamic pricing, upselling packages, and ensuring sufficient staffing during peak periods.');
    } else if (occupancyRate >= 60) {
      suggestions.push('Moderate occupancy — focus on targeted promotions during off-peak days and improve guest retention.');
    } else {
      suggestions.push('Low occupancy — run targeted promotions, bundle offers, or partner with local events to increase bookings.');
    }
    // housekeeping suggestions
    if (ongoingHousekeeping > Math.max(3, Math.round(checkedInCount * 0.15))) {
      suggestions.push('Housekeeping workload is relatively high — consider adding shifts or reassigning staff to reduce backlog.');
    }
    // maintenance suggestions
    if (ongoingMaintenance > Math.max(2, Math.round(checkedInCount * 0.08))) {
      suggestions.push('Maintenance requests are elevated — prioritize recurring issues and schedule preventive maintenance in low-occupancy windows.');
    }
    // busiest months suggestions
    if (busiestMonths.length > 0 && busiestMonths[0].count > 0) {
      const peak = busiestMonths[0];
      suggestions.push(`Peak month: ${peak.name}. Prepare staffing and inventory two weeks before the start of this month.`);
    }
    // room type suggestions
    const popularType = Object.entries(roomTypeCounts).sort((a,b)=>b[1]-a[1])[0];
    if (popularType && popularType[0]) {
      suggestions.push(`Most occupied room type: ${popularType[0]}. Consider promoting upgrades or add-ons for this segment.`);
    }
    return suggestions;
  };

  const suggestions = generateSuggestions();

  // Export report as JSON
  const exportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      totalRooms,
      checkedInCount,
      occupancyRate,
      busiestMonths,
      roomTypeCounts,
      suggestions,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hotel-report-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Recompute chart counts when bookings or filters change
  useEffect(() => {
    const monthsCount = Array(12).fill(0);

    // helper to get booking date
    function getBookingDate(b) {
      const dateStr = b.checkInDate || b.checkIn || b.checkinDate || b.bookedAt;
      if (!dateStr) return null;
      const d = new Date(dateStr);
      return isNaN(d) ? null : d;
    }

    if (selectedMonth === 'All') {
      // monthly aggregation
      bookingsData.forEach(b => {
        const d = getBookingDate(b);
        if (!d) return;
        if (selectedYear !== 'All' && d.getFullYear().toString() !== selectedYear) return;
        monthsCount[d.getMonth()]++;
      });
      setMonthlyCounts(monthsCount);
    } else {
      // daily aggregation for selected month (requires a year)
      if (selectedYear === 'All') {
        // if year not selected, fall back to monthly counts
        bookingsData.forEach(b => {
          const d = getBookingDate(b);
          if (!d) return;
          monthsCount[d.getMonth()]++;
        });
        setMonthlyCounts(monthsCount);
      } else {
        const year = parseInt(selectedYear, 10);
        const monthIndex = parseInt(selectedMonth, 10); // 0-11
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const dayCounts = Array(daysInMonth).fill(0);
        bookingsData.forEach(b => {
          const d = getBookingDate(b);
          if (!d) return;
          if (d.getFullYear() !== year) return;
          if (d.getMonth() !== monthIndex) return;
          dayCounts[d.getDate() - 1]++;
        });
        // store daily counts in monthlyCounts for chart rendering
        setMonthlyCounts(dayCounts);
      }
    }
  }, [bookingsData, selectedYear, selectedMonth]);

  const chartData = {
    labels: (selectedMonth === 'All') ? [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ] : Array.from({ length: monthlyCounts.length }, (_, i) => `Day ${i + 1}`),
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
                <div style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div>
                    <label style={{ marginRight: 8 }}>Year:</label>
                    <select value={selectedYear} onChange={e => { setSelectedYear(e.target.value); setSelectedMonth('All'); }}>
                      <option value="All">All Years</option>
                      {availableYears.map(y => (
                        <option key={y} value={y.toString()}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ marginRight: 8 }}>Month:</label>
                    <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} disabled={selectedYear === 'All'}>
                      <option value="All">All Months</option>
                      {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, idx) => (
                        <option key={m} value={idx.toString()}>{m}</option>
                      ))}
                    </select>
                    {selectedYear === 'All' && <small style={{ marginLeft: 8, color: '#666' }}>Select a year to enable month filter</small>}
                  </div>
                </div>
                <Bar data={chartData} options={chartOptions} />
            </div>
            <div className="chart-panel pie">
              <Pie data={pieData} options={pieOptions} />
            </div>
          </div>
        )}
      </div>
      {/* Automated Report & Suggestions */}
      <div className="automated-report">
        <h2 className="automated-report-title">Automated Report</h2>
        <div className="automated-report-grid">
          <div className="report-left">
            <div className="report-occupancy-value">{occupancyRate}%</div>
            <div className="report-occupancy-label">Occupancy Rate</div>
            <div className="report-stats">
              <div><strong>Total rooms:</strong> {totalRooms}</div>
              <div><strong>Checked in:</strong> {checkedInCount}</div>
              <div><strong>Ongoing housekeeping:</strong> {ongoingHousekeeping}</div>
              <div><strong>Ongoing maintenance:</strong> {ongoingMaintenance}</div>
            </div>
            <button className="report-export-btn" onClick={exportReport}>Export JSON</button>
          </div>
          <div className="report-main">
            <h4 className="report-section-title">Busiest Months</h4>
            {busiestMonths.length === 0 ? (
              <div className="muted">No booking data available.</div>
            ) : (
              <ol className="busiest-months-list">
                {busiestMonths.map(m => (
                  <li key={m.name}>{m.name} — {m.count} bookings</li>
                ))}
              </ol>
            )}
            <h4 className="report-section-title">Suggestions</h4>
            <ul className="report-suggestions">
              {suggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div className="report-right">
            <h4 className="report-section-title">Quick Analysis</h4>
            <div className="report-summary">
              {(() => {
                const peak = busiestMonths[0];
                const parts = [];
                parts.push(`Current occupancy is ${occupancyRate}%.`);
                if (peak && peak.count > 0) parts.push(`Peak month is ${peak.name} with ${peak.count} bookings.`);
                if (ongoingHousekeeping > 0) parts.push(`There are ${ongoingHousekeeping} active housekeeping tasks.`);
                if (ongoingMaintenance > 0) parts.push(`There are ${ongoingMaintenance} active maintenance tasks.`);
                parts.push('Recommendations: ' + suggestions.slice(0,3).join(' '));
                return parts.join(' ');
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
