import React, { useEffect, useState } from 'react';
import HotelAdminDashboard from './HotelAdminDashboard';
import './HotelAdminRooms.css';

function getRoomCardColor(status, type) {
  if (status === 'booked') return 'room-card-blue';
  if (status === 'occupied') return 'room-card-red';
  if (status === 'cleaning') return 'room-card-green';
  if (status === 'maintenance') return 'room-card-gray';
  // fallback by type or default
  return 'room-card-gray';
}

const floors = [1,2,3,4,5,6,7,8,9,10];

export default function HotelAdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFloor, setSelectedFloor] = useState(1);

  useEffect(() => {
    async function fetchRooms() {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/rooms`);
        if (!res.ok) throw new Error('Failed to fetch rooms');
        const data = await res.json();
        setRooms(data);
      } catch (err) {
        setError('Could not load rooms.');
      } finally {
        setLoading(false);
      }
    }
    fetchRooms();
  }, []);

  // Filter rooms by selected floor (assuming roomNumber starts with floor number)
  const filteredRooms = rooms.filter(r => {
    if (!r.roomNumber) return false;
    return String(r.roomNumber).startsWith(String(selectedFloor));
  });

  return (
    <HotelAdminDashboard>
      <div className="hotel-admin-rooms-content">
        <h2 className="hotel-admin-rooms-title">Rooms</h2>
        {loading ? (
          <div className="hotel-admin-rooms-loading">Loading rooms...</div>
        ) : error ? (
          <div className="hotel-admin-rooms-error">{error}</div>
        ) : (
          <div className="hotel-admin-rooms-grid">
            {filteredRooms.map(room => (
              <div key={room._id} className={`room-card-v2 ${getRoomCardColor(room.status, room.roomType)}`}>
                <div style={{display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.2rem'}}>
                  <div className="room-card-v2-number">{room.roomNumber}</div>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                    <div className="room-card-v2-type-upper">{room.roomType}</div>
                    <div className="room-card-v2-type-desc">{room.description || '2 pax'}</div>
                  </div>
                </div>
                <div className="room-card-v2-amenities">
                  <b>Amenities:</b>
                  {room.amenities && room.amenities.length > 0 ? (
                    <ul className="room-card-v2-list">
                      {room.amenities.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  ) : (
                    <span> None</span>
                  )}
                </div>
                <div className="room-card-v2-facilities">
                  <b>Facilities:</b>
                  {room.facilities && room.facilities.length > 0 ? (
                    <ul className="room-card-v2-list">
                      {room.facilities.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  ) : (
                    <span> None</span>
                  )}
                </div>
                {/* Add more info as needed, e.g. guest, status, etc. */}
                <button className="room-card-v2-manage">Manage</button>
              </div>
            ))}
          </div>
        )}
        <div className="hotel-admin-rooms-floor-selector">
          {floors.map(f => (
            <button
              key={f}
              className={`hotel-admin-rooms-floor-btn${selectedFloor === f ? ' selected' : ''}`}
              onClick={() => setSelectedFloor(f)}
            >
              {f}F
            </button>
          ))}
        </div>
      </div>
    </HotelAdminDashboard>
  );
}