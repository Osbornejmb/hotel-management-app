import './HotelAdminHousekeeping.css';

import React, { useEffect, useState } from 'react';
import HotelAdminDashboard from './HotelAdminDashboard';

// Tooltip component for employee details (fixed position to avoid clipping)
function EmployeeTooltip({ employee, children }) {
  const [visible, setVisible] = React.useState(false);
  const [pos, setPos] = React.useState({ left: 0, top: 0 });
  const anchorRef = React.useRef(null);

  const onEnter = () => {
    const el = anchorRef.current;
    if (!el) {
      setVisible(true);
      return;
    }
    const rect = el.getBoundingClientRect();
    setPos({ left: rect.left + rect.width / 2, top: rect.bottom + 8 });
    setVisible(true);
  };
  const onLeave = () => setVisible(false);

  return (
    <span
      ref={anchorRef}
      style={{ position: 'relative', cursor: 'pointer', textDecoration: 'underline dotted', display: 'inline-block' }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {children}
      {visible && employee && (
        <div style={{
          position: 'fixed',
          left: pos.left,
          top: pos.top,
          transform: 'translateX(-50%)',
          background: '#fffbe6',
          color: '#222',
          border: '1px solid #c9a74b',
          borderRadius: '8px',
          boxShadow: '0 2px 8px #c9a74b44',
          padding: '0.7rem 1.2rem',
          zIndex: 9999,
          minWidth: '220px',
          fontSize: '0.95rem',
        }}>
          <div><strong>Employee Code:</strong> {employee.employeeCode}</div>
          <div><strong>Name:</strong> {employee.name}</div>
          <div><strong>Role:</strong> {employee.role || '-'}</div>
          <div><strong>Department:</strong> {employee.department || '-'}</div>
          <div><strong>Job Title:</strong> {employee.jobTitle || '-'}</div>
        </div>
      )}
    </span>
  );
}

function HotelAdminHousekeeping() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState([]);

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
    async function fetchEmployees() {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/employees`);
        if (res.ok) {
          const data = await res.json();
          setEmployees(Array.isArray(data) ? data : data.employees || []);
        }
      } catch (err) {
        setEmployees([]);
      }
    }
    fetchEmployees();
  }, []);

  // Helper to normalize IDs (remove leading zeros, convert to string)
  // Normalize to string and remove leading zeros for robust matching
  const normalize = v => {
    if (v === undefined || v === null) return '';
    // Convert to string, remove all non-digit chars, then remove leading zeros
    return v.toString().replace(/[^\d]/g, '').replace(/^0+/, '');
  };

  // Filter and map tasks
  const filteredTasks = tasks.filter(t =>
    t.type && t.type.toUpperCase() === 'CLEANING' && (
      t.room?.toString().includes(search) ||
      t.taskId?.toLowerCase().includes(search.toLowerCase()) ||
      t.employeeId?.toLowerCase().includes(search.toLowerCase())
    )
  ).map(task => {
    let timeFinished = 'Not yet finished';
    if (task.status && task.status.toUpperCase() === 'COMPLETED') {
      timeFinished = task.finishedAt ? new Date(task.finishedAt).toLocaleString() : (task.updatedAt ? new Date(task.updatedAt).toLocaleString() : new Date().toLocaleString());
    }
    // Find employee by matching normalized employeeId only
    const taskEmpIdNorm = normalize(task.employeeId);
    // Debug: log normalized employeeId for task and all employees
    if (task.employeeId) {
      console.log('Task:', task.taskId, 'task.employeeId:', task.employeeId, 'normalized:', taskEmpIdNorm);
      employees.forEach(e => {
        console.log('Employee:', e.name, 'employeeId:', e.employeeId, 'normalized:', normalize(e.employeeId));
      });
    }
    const emp = employees.find(e =>
      normalize(e.employeeId) === taskEmpIdNorm
    );
    return { ...task, timeFinished, employee: emp };
  });

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
              <th>Time Assigned</th>
              <th>Time Finished</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr><td colSpan={7} className="housekeeping-table-empty">No tasks found.</td></tr>
            ) : (
              filteredTasks.map((t, i) => (
                <tr key={t._id || i}>
                  <td>{t.room}</td>
                  <td>{t.taskId}</td>
                  <td>
                    {t.employee ? (
                      <EmployeeTooltip employee={t.employee}>
                        {t.employee.name}
                      </EmployeeTooltip>
                    ) : (
                      t.employeeId || '-'
                    )}
                  </td>
                  <td>{t.status}</td>
                  <td>{t.priority}</td>
                  <td>{t.createdAt ? new Date(t.createdAt).toLocaleString() : ''}</td>
                  <td>{t.timeFinished || ''}</td>
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
