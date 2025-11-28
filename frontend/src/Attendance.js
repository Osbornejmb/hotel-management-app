import React, { useState, useEffect } from 'react';

const Attendance = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);

  const loadRecords = async () => {
    try {
      const res = await fetch('/api/attendances');
      if (!res.ok) return;
      const data = await res.json();
      setRecords((data || []).slice().reverse().slice(0, 10));
    } catch (err) {
      console.error('Error loading attendance records', err);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!employeeId) return;
    setLoading(true);
    setMessage('');
    setDetails(null);
    try {
      const res = await fetch('/api/attendances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
      } else if (data.status === 'clocked-in') {
        setMessage(`Good Morning, ${data.employeeName}`);
        setDetails({ label: 'Clocked In', time: new Date(data.clockIn).toLocaleTimeString() });
      } else if (data.status === 'clocked-out') {
        setMessage(`Thank You, ${data.employeeName}`);
        setDetails({ label: 'Clocked Out', time: new Date(data.clockOut).toLocaleTimeString(), total: data.totalHours ? data.totalHours.toFixed(2) : undefined });
      }
      setEmployeeId('');
      // Refresh list of records so dashboard reflects the new attendance
      await loadRecords();
      setTimeout(() => {
        setMessage('');
        setDetails(null);
      }, 5000);
    } catch (err) {
      setMessage('Error connecting to server.');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 800, margin: '24px auto', textAlign: 'center' }}>
      <h2>Employee Attendance</h2>
      <div style={{ marginBottom: 12 }}>
        <input
          type="password"
          placeholder="Enter Employee ID"
          value={employeeId}
          onChange={e => {
            const val = e.target.value;
            setEmployeeId(val);
            if (val.length === 10 && !loading) {
              handleSubmit();
              setEmployeeId('');
            }
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && employeeId.length === 10 && !loading) {
              handleSubmit();
              setEmployeeId('');
            }
          }}
          maxLength={10}
          disabled={loading}
          style={{ padding: '10px', width: '60%', fontSize: '1rem' }}
        />
      </div>
      {message && <div style={{ marginTop: 10, fontSize: '1.1rem', fontWeight: 'bold' }}>{message}</div>}
      {details && (
        <div style={{ marginTop: 8 }}>
          <div>{details.label}: {details.time}</div>
          {details.total && <div>Total Hours Worked: {details.total}</div>}
        </div>
      )}

      <div style={{ marginTop: 20, textAlign: 'left' }}>
        <h3>Recent Attendance Records</h3>
        <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '8px' }}>Employee ID</th>
                <th style={{ padding: '8px' }}>Name</th>
                <th style={{ padding: '8px' }}>Date</th>
                <th style={{ padding: '8px' }}>Clock In</th>
                <th style={{ padding: '8px' }}>Clock Out</th>
                <th style={{ padding: '8px' }}>Hours</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '12px', color: '#666' }}>No attendance records yet</td></tr>
              )}
              {records.map(r => (
                <tr key={r._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '8px' }}>{r.employeeId}</td>
                  <td style={{ padding: '8px' }}>{r.employeeName}</td>
                  <td style={{ padding: '8px' }}>{r.date}</td>
                  <td style={{ padding: '8px' }}>{r.clockIn ? new Date(r.clockIn).toLocaleTimeString() : '-'}</td>
                  <td style={{ padding: '8px' }}>{r.clockOut ? new Date(r.clockOut).toLocaleTimeString() : '-'}</td>
                  <td style={{ padding: '8px' }}>{r.totalHours ? (Math.round(r.totalHours * 100) / 100) : 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
