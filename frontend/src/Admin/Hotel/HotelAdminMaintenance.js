import './HotelAdminMaintenance.css';

import React, { useEffect, useState } from 'react';
import HotelAdminDashboard from './HotelAdminDashboard';

function HotelAdminMaintenance() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchTasks() {
      try {
  const res = await fetch(`${process.env.REACT_APP_API_URL}/api/tasks/maintenance`);
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

  // Filter tasks by search
  const filteredTasks = tasks.filter(t =>
    t.room?.toString().includes(search) ||
    t.taskId?.toLowerCase().includes(search.toLowerCase()) ||
    t.employeeId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <HotelAdminDashboard>
      <div className="maintenance-container">
        <h2 className="maintenance-title">Maintenance Tasks</h2>
        <input
          type="text"
          placeholder="Search by Room, Task ID, or Employee..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="maintenance-search"
        />
        <table className="maintenance-table">
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
              <tr><td colSpan={5} className="maintenance-table-empty">No tasks found.</td></tr>
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

export default HotelAdminMaintenance;
