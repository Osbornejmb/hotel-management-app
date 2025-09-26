import React, { useState } from 'react';

const Attendance = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId) return;
    setLoading(true);
    setMessage('');
    setDetails(null);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      });
      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
      } else if (data.status === 'clocked-in') {
        setMessage(`Good Morning, ${data.employeeName}`);
        setDetails({ label: 'Clocked In', time: new Date(data.clockIn).toLocaleTimeString() });
      } else if (data.status === 'clocked-out') {
        setMessage(`Thank You, ${data.employeeName}`);
        setDetails({ label: 'Clocked Out', time: new Date(data.clockOut).toLocaleTimeString(), total: data.totalHours.toFixed(2) });
      } else if (data.status === 'already-clocked-out') {
        setMessage(`Already clocked out, ${data.employeeName}`);
        setDetails({ label: 'Clocked Out', time: new Date(data.clockOut).toLocaleTimeString(), total: data.totalHours.toFixed(2) });
      }
      setEmployeeId('');
      setTimeout(() => {
        setMessage('');
        setDetails(null);
      }, 5000);
    } catch (err) {
      setMessage('Error connecting to server');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', textAlign: 'center' }}>
      <h2>Employee Attendance</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter Employee ID"
          value={employeeId}
          onChange={e => setEmployeeId(e.target.value)}
          disabled={loading}
          style={{ padding: '10px', width: '80%', fontSize: '1rem' }}
        />
        <button type="submit" disabled={loading || !employeeId} style={{ marginLeft: 10, padding: '10px 20px' }}>
          Submit
        </button>
      </form>
      {message && <div style={{ marginTop: 30, fontSize: '1.2rem', fontWeight: 'bold' }}>{message}</div>}
      {details && (
        <div style={{ marginTop: 10 }}>
          <div>{details.label}: {details.time}</div>
          {details.total && <div>Total Hours Worked: {details.total}</div>}
        </div>
      )}
    </div>
  );
};

export default Attendance;
