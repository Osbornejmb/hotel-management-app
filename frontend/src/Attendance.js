import React, { useState } from 'react';

const Attendance = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!employeeId) return;
    setLoading(true);
    setMessage('');
    setDetails(null);
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      });
      const data = await response.json();

      if (response.ok) {
        if (data.status === 'clocked-in') {
          setMessage(`Welcome, ${data.employeeName}! You are clocked in.`);
          setDetails({ label: 'Clocked In', time: new Date(data.clockIn).toLocaleTimeString() });
        } else if (data.status === 'clocked-out') {
          setMessage(`Thank You, ${data.employeeName}! You are clocked out.`);
          setDetails({ label: 'Clocked Out', time: new Date(data.clockOut).toLocaleTimeString(), total: data.totalHours.toFixed(2) });
        }
      } else {
        setMessage(data.error || 'An error occurred.');
      }
    } catch (error) {
      setMessage('Failed to connect to the server.');
    } finally {
      setLoading(false);
      setEmployeeId('');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', textAlign: 'center' }}>
      <h2>Employee Attendance</h2>
      <input
        type="password"
        placeholder="Enter Employee ID"
        value={employeeId}
        onChange={(e) => setEmployeeId(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && employeeId.length === 10 && !loading) {
            handleSubmit();
          }
        }}
        maxLength={10}
        disabled={loading}
        style={{ padding: '10px', width: '80%', fontSize: '1rem' }}
      />
      {message && <div style={{ marginTop: 20, fontSize: '1.2rem', fontWeight: 'bold' }}>{message}</div>}
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
