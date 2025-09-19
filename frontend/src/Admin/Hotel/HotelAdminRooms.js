import React, { useEffect, useState } from 'react';
import HotelAdminDashboard from './HotelAdminDashboard';

function RoomCard({ room }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '10px',
      boxShadow: '0 2px 8px #bbb',
      padding: '1.2rem 1.2rem 0.8rem 1.2rem',
      margin: '0.7rem',
      width: '200px',
      minHeight: '240px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      position: 'relative',
    }}>
      <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#444', textShadow: '0 2px 8px #ccc', lineHeight: 1 }}>{room.roomNumber}</div>
      <div style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', fontWeight: 500, color: '#444', fontSize: '1.1rem', textAlign: 'right' }}>
        {room.roomType} <br />
        <span style={{ fontSize: '0.95rem', color: '#222', fontWeight: 400 }}>({room.description || '2 pax'})</span>
      </div>
      <div style={{ marginTop: '2.5rem', fontWeight: 600, color: '#222' }}>Amenities:</div>
      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.98rem', color: '#222' }}>
        {room.amenities && room.amenities.length > 0 ? room.amenities.map((a, i) => <li key={i}>{a}</li>) : <li>None</li>}
      </ul>
      <div style={{ fontWeight: 600, color: '#222', marginTop: '0.5rem' }}>Facilities:</div>
      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.98rem', color: '#222' }}>
        {/* Placeholder, replace with real facilities if available */}
        <li>Free Breakfast</li>
        <li>Swimming Pool Access</li>
      </ul>
      <button style={{
        marginTop: 'auto',
        alignSelf: 'flex-end',
        background: '#eee',
        color: '#444',
        border: 'none',
        borderRadius: '7px',
        padding: '0.4rem 1.2rem',
        fontWeight: 600,
        fontSize: '1rem',
        boxShadow: '1px 2px 4px #ccc',
        cursor: 'pointer',
        marginBottom: '0.3rem',
        marginRight: '0.2rem',
        transition: 'background 0.2s, color 0.2s',
      }}
        onMouseOver={e => { e.target.style.background = '#bbb'; e.target.style.color = '#fff'; }}
        onMouseOut={e => { e.target.style.background = '#eee'; e.target.style.color = '#444'; }}
      >
        Manage
      </button>
    </div>
  );
}

function HotelAdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchRooms() {
      try {
        const res = await fetch('/api/rooms');
        if (!res.ok) throw new Error('Failed to fetch rooms');
        const data = await res.json();
        console.log('Fetched rooms:', data); // Debug log
        setRooms(data);
      } catch (err) {
        setError('Could not load rooms.');
      } finally {
        setLoading(false);
      }
    }
    fetchRooms();
  }, []);

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>
     
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2rem' }}>
        <h2 style={{ color: '#222', fontWeight: 700, marginBottom: '2rem', textAlign: 'center' }}>ROOMS PAGE TEST LABEL</h2>
        {loading ? (
          <div style={{ color: '#222', fontWeight: 600 }}>Loading rooms...</div>
        ) : error ? (
          <div style={{ color: 'red', fontWeight: 600 }}>{error}</div>
        ) : rooms.length === 0 ? (
          <div style={{ color: '#222', fontWeight: 600 }}>No rooms found in the database.</div>
        ) : (
          <table style={{ borderCollapse: 'collapse', width: '90%', maxWidth: '1200px', background: '#fff', boxShadow: '0 2px 8px #bbb', borderRadius: '10px', overflow: 'hidden' }}>
            <thead style={{ background: '#FFD700', color: '#222' }}>
              <tr>
                <th style={{ padding: '0.8rem', border: '1px solid #ddd' }}>Room Number</th>
                <th style={{ padding: '0.8rem', border: '1px solid #ddd' }}>Room Type</th>
                <th style={{ padding: '0.8rem', border: '1px solid #ddd' }}>Description</th>
                <th style={{ padding: '0.8rem', border: '1px solid #ddd' }}>Amenities</th>
                <th style={{ padding: '0.8rem', border: '1px solid #ddd' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => (
                <tr key={room._id} style={{ background: '#f9f9f9', color: '#222' }}>
                  <td style={{ padding: '0.7rem', border: '1px solid #ddd', textAlign: 'center' }}>{room.roomNumber}</td>
                  <td style={{ padding: '0.7rem', border: '1px solid #ddd', textAlign: 'center' }}>{room.roomType}</td>
                  <td style={{ padding: '0.7rem', border: '1px solid #ddd', textAlign: 'center' }}>{room.description || '-'}</td>
                  <td style={{ padding: '0.7rem', border: '1px solid #ddd', textAlign: 'center' }}>{room.amenities && room.amenities.length > 0 ? room.amenities.join(', ') : '-'}</td>
                  <td style={{ padding: '0.7rem', border: '1px solid #ddd', textAlign: 'center' }}>{room.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default HotelAdminRooms;
