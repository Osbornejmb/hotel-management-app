import './HotelAdminHousekeeping.css';

import React, { useEffect, useState } from 'react';
import HotelAdminDashboard from './HotelAdminDashboard';

function HotelAdminHousekeeping() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/tasks`);
        if (res.ok) {
          const data = await res.json();
          setTasks(Array.isArray(data) ? data : data.tasks || []);
        }
      } catch (err) {
        setTasks([]);
      }
    }
    fetchTasks();
  }, []);

  // Filter tasks by type 'CLEANING' and search
  const filteredTasks = tasks.filter(t =>
    t.type && t.type.toUpperCase() === 'CLEANING' && (
      t.room?.toString().includes(search) ||
      t.taskId?.toLowerCase().includes(search.toLowerCase()) ||
      t.employeeId?.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <HotelAdminDashboard>
      <div className="housekeeping-container">
        <h2 className="housekeeping-title">Housekeeping Tasks</h2>
        <input
          type="text"
          placeholder="Search by Room, Task ID, or Employee..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="housekeeping-search"
        />
        <table className="housekeeping-table">
          <thead>
            <tr>
              <th>Room No.</th>
              <th>Task ID</th>
              <th>Employee</th>
              <th>Status</th>
              <th>Priority</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr><td colSpan={5} className="housekeeping-table-empty">No tasks found.</td></tr>
            ) : (
              filteredTasks.map((t, i) => (
                <tr key={t._id || i}>
                  <td>{t.room}</td>
                  <td>{t.taskId}</td>
                  <td>{t.employeeId}</td>
                  <td>{t.status}</td>
                  <td>{t.priority}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </HotelAdminDashboard>
  );
}

export default HotelAdminHousekeeping;
