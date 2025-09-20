import React, { useEffect, useState } from 'react';
import HotelAdminDashboard from './HotelAdminDashboard';

function RoomCard({ room, onManage }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 4px 16px #bbb',
      padding: '1.6rem 1.6rem 1.1rem 1.6rem',
      margin: '1rem',
      width: '250px',
      minHeight: '300px',
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
        {room.facilities && room.facilities.length > 0
          ? room.facilities.map((f, i) => <li key={i}>{f}</li>)
          : <li>None</li>}
      </ul>
      <button
        style={{
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
        onClick={() => onManage(room)}
      >
        Manage
      </button>
    </div>
  );
}

function HotelAdminRooms() {
  const [showModal, setShowModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
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
    <HotelAdminDashboard>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2rem' }}>
        {loading ? (
          <div style={{ color: '#222', fontWeight: 600 }}>Loading rooms...</div>
        ) : error ? (
          <div style={{ color: 'red', fontWeight: 600 }}>{error}</div>
        ) : rooms.length === 0 ? (
          <div style={{ color: '#222', fontWeight: 600 }}>No rooms found in the database.</div>
        ) : (
          <div style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-start',
            paddingLeft: '15vw',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gridTemplateRows: 'repeat(2, 1fr)',
              gap: '1.2rem',
              maxWidth: '1400px',
            }}>
              {rooms.slice(0, 10).map(room => (
                <RoomCard key={room._id} room={room} onManage={(room) => { setSelectedRoom(room); setShowModal(true); }} />
              ))}
            </div>
          </div>
        )}

        {/* Modal for managing room */}
        {showModal && selectedRoom && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              boxShadow: '0 8px 32px #888',
              padding: '2.5rem 2.5rem 2rem 2.5rem',
              minWidth: '400px',
              maxWidth: '95vw',
              position: 'relative',
            }}>
              <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 10, right: 10, background: '#f44', color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, fontWeight: 700, fontSize: 18, cursor: 'pointer' }}>X</button>
              <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Room {selectedRoom.roomNumber} <span style={{ color: '#1a7cff', fontSize: '1rem', fontWeight: 600, marginLeft: 10 }}>{selectedRoom.status === 'Occupied' ? '• Occupied' : ''}</span></div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Room Type: <span style={{ fontWeight: 400 }}>{selectedRoom.roomType} ({selectedRoom.description || '2 pax'})</span></div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Amenities: <span style={{ fontWeight: 400 }}>{selectedRoom.amenities?.join(', ') || 'None'}</span></div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Facilities: <span style={{ fontWeight: 400 }}>{selectedRoom.facilities?.join(', ') || 'None'}</span></div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Availability: <span style={{ fontWeight: 400 }}>{selectedRoom.availability || 'N/A'}</span></div>
              {/* Form fields and dropdowns will go here */}
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 600 }}>Assign Housekeeping</label><br />
                  <select style={{ width: '100%', padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc' }}>
                    <option value="">Select employee</option>
                    {/* Housekeeping options will go here */}
                  </select>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 600 }}>Assign Maintenance</label><br />
                  <select style={{ width: '100%', padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc' }}>
                    <option value="">Select employee</option>
                    {/* Maintenance options will go here */}
                  </select>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 600 }}>Extend Stay</label><br />
                  <input type="text" style={{ width: '100%', padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc' }} placeholder="Select date/time" />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.2rem' }}>
                  <button style={{ background: '#2ecc40', color: '#fff', border: 'none', borderRadius: 7, padding: '0.6rem 1.5rem', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 2px 8px #bfb' }}>Mark as Available</button>
                  <button style={{ background: '#f44', color: '#fff', border: 'none', borderRadius: 7, padding: '0.6rem 1.5rem', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 2px 8px #fbb' }}>Checkout</button>
                </div>
                <div style={{ marginTop: '2rem', background: '#fafafa', borderRadius: 8, boxShadow: '0 2px 8px #eee', padding: '1rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>ACTIVITY LOG:</div>
                  {/* Activity log entries will go here */}
                  <div style={{ fontSize: '0.98rem', color: '#444' }}>[Activity log here]</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </HotelAdminDashboard>
  );
}

export default HotelAdminRooms;
