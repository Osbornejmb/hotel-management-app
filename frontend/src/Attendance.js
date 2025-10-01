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
          setMessage(`Good Evening, ${data.employeeName}`);
          setDetails({
            label: 'Clocked In',
            time: new Date(data.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        } else if (data.status === 'clocked-out') {
          setMessage(`Thank You, ${data.employeeName}`);
          setDetails({
            label: 'Clocked Out',
            time: new Date(data.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            total: data.totalHours.toFixed(2)
          });
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
    <div
      style={{
        height: '100vh',
        width: '100%',
        backgroundImage: `url("AttendanceBackground.png")`, 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'Playfair Display', serif", 
        color: '#fff',
        position: 'relative'
      }}
    >
      {/* Title */}
      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '7rem',
          fontWeight: '700',
          color: '#E4B169',
          position: 'absolute',
          top: '10px',
          textAlign: 'center'
        }}
      >
        <span style={{ position: 'relative', display: 'inline-block' }}>
          L
          {/* Custom underline only under L */}
          <span
            style={{
              position: 'absolute',
              left: 0,
              bottom: -10,
              width: '80px',
              height: '3px',
              backgroundColor: '#fff'
            }}
          ></span>
        </span>
        UMINE
        {/* Subtitle */}
        <span
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: '0.8rem',
            fontWeight: '400',
            color: '#fff',
            position: 'absolute',
            bottom: -20,
            right: -90,
            letterSpacing: '1px'
          }}
        >
          HOTEL MANAGEMENT SYSTEM
        </span>
      </h1>

      {/* Input box */}
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
        style={{
          marginTop: '120px',
          width: '320px',
          padding: '12px 15px',
          fontSize: '1.2rem',
          textAlign: 'center',
          border: 'none',
          borderRadius: '6px',
          outline: 'none',
          background: 'rgba(255, 255, 255, 0.85)',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
          letterSpacing: '4px',
          fontFamily: "'Playfair Display', serif"
        }}
      />

      {/* Message */}
      {message && (
        <div style={{ marginTop: 25, fontSize: '1.4rem', fontWeight: '600' }}>
          {message}
        </div>
      )}

      {/* Details */}
      {details && (
        <div style={{ marginTop: 10, fontSize: '1.2rem' }}>
          <div>
            {details.label}:{" "}
            <span style={{ color: '#7FFF00', fontWeight: 'bold' }}>
              {details.time}
            </span>
          </div>
          {details.total && (
            <div style={{ marginTop: 6, fontSize: '1.2rem', color: '#e0e0e0' }}>
              Total Hours Worked: {details.total}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer
        style={{
          position: 'absolute',
          bottom: '20px',
          width: '100%',
          textAlign: 'center',
          fontSize: '1rem',
          fontWeight: 'normal',
          letterSpacing: '2px'
        }}
      >
        PLEASE TAP YOUR ID ON THE SCANNER
      </footer>
    </div>
  );
};

export default Attendance;
