import React, { useState } from 'react';

const Attendance = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
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
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
      } else if (data.status === 'clocked-in') {
        setMessage(`Good Morning, ${data.employeeName}`);
        setDetails({ label: 'Clocked In', time: new Date(data.clockIn).toLocaleTimeString() });
      } else if (data.status === 'clocked-out') {
        setMessage(`Thank You, ${data.employeeName}`);
        setDetails({ label: 'Clocked Out', time: new Date(data.clockOut).toLocaleTimeString(), total: data.totalHours.toFixed(2) });
      }
      setEmployeeId('');
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
    <div style={{ maxWidth: 400, margin: '40px auto', textAlign: 'center' }}>
      <h2>Employee Attendance</h2>
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
        style={{ padding: '10px', width: '80%', fontSize: '1rem' }}
      />
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
