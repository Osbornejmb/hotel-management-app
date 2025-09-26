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
  const [modalRoom, setModalRoom] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, jobType: '', room: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

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
  {/* <h2 className="hotel-admin-rooms-title">Rooms</h2> */}
        {loading ? (
          <div className="hotel-admin-rooms-loading">Loading rooms...</div>
        ) : error ? (
          <div className="hotel-admin-rooms-error">{error}</div>
        ) : (
          <div className="hotel-admin-rooms-grid">
            {filteredRooms.map(room => (
              <div key={room._id} className={`room-card-v2 ${getRoomCardColor(room.status, room.roomType)}`}>
                <div style={{display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.2rem'}}>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0}}>
                    <div className="room-card-v2-number">{room.roomNumber}</div>
                    <div className={`room-card-v2-status room-card-v2-status-${room.status || 'unknown'}`}>{room.status ? room.status.charAt(0).toUpperCase() + room.status.slice(1) : 'Unknown'}</div>
                  </div>
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
                <button className="room-card-v2-manage" onClick={() => setModalRoom(room)}>Manage</button>
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
      {/* Modal Placeholder */}
      {modalRoom && (
  <div className="room-modal-backdrop" onClick={() => setModalRoom(null)}>
    <div className="room-modal" onClick={e => e.stopPropagation()}>
      <button className="room-modal-close" onClick={() => setModalRoom(null)}>×</button>
      <h3 className="room-modal-title">Room {modalRoom.roomNumber}</h3>

      <div className="room-modal-section">
        <div><strong>Room Type:</strong> {modalRoom.roomType}</div>
        <div><strong>Description:</strong> {modalRoom.description || '2 pax'}</div>
        <div><strong>Status:</strong> {modalRoom.status}</div>
        <div><strong>Availability:</strong> {modalRoom.isAvailable ? 'Yes - Ready for Check-in' : 'No'}</div>
        <div><strong>Amenities:</strong> {modalRoom.amenities?.join(', ') || 'None'}</div>
        <div><strong>Facilities:</strong> {modalRoom.facilities?.join(', ') || 'None'}</div>
      </div>

      <div className="room-modal-actions-right">
        <button
          className="modal-btn request-cleaning"
          onClick={() => setConfirmModal({ open: true, jobType: 'cleaning', room: modalRoom })}
        >
          Request Cleaning
        </button>
        <button
          className="modal-btn request-maintenance"
          onClick={() => setConfirmModal({ open: true, jobType: 'maintenance', room: modalRoom })}
        >
          Request Maintenance
        </button>
      </div>

      <div className="room-modal-log expanded">
        <h4>Activity Log</h4>
        <ul>
          <li>PLACEHOLDER</li>
          <li>PLACEHOLDER</li>
        </ul>
      </div>
    </div>
  </div>
)}

  {/* Confirmation Modal */}
  {confirmModal.open && (
    <div className="room-modal-backdrop" style={{zIndex: 2000}}>
      <div className="room-modal" style={{maxWidth: 350, textAlign: 'center'}}>
        <h4>Confirm {confirmModal.jobType === 'cleaning' ? 'Cleaning' : 'Maintenance'} Request</h4>
        <p>Are you sure you want to request <b>{confirmModal.jobType}</b> for <b>Room {confirmModal.room?.roomNumber}</b>?</p>
        {actionError && <div style={{color: 'red', marginBottom: 8}}>{actionError}</div>}
        {actionSuccess && <div style={{color: 'green', marginBottom: 8}}>{actionSuccess}</div>}
        <div style={{display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16}}>
          <button
            className="modal-btn available"
            disabled={actionLoading}
            onClick={async () => {
              setActionLoading(true);
              setActionError('');
              setActionSuccess('');
              try {
                const res = await fetch(`${process.env.REACT_APP_API_URL}/api/requests`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    roomName: confirmModal.room?.roomNumber || '',
                    jobType: confirmModal.jobType,
                    date: new Date().toISOString(),
                  })
                });
                if (!res.ok) throw new Error('Failed to create request');
                setActionSuccess('Request submitted!');
                setTimeout(() => {
                  setConfirmModal({ open: false, jobType: '', room: null });
                  setActionSuccess('');
                }, 1000);
              } catch (err) {
                setActionError('Could not submit request.');
              } finally {
                setActionLoading(false);
              }
            }}
          >
            Confirm
          </button>
          <button
            className="modal-btn checkout"
            disabled={actionLoading}
            onClick={() => {
              setConfirmModal({ open: false, jobType: '', room: null });
              setActionError('');
              setActionSuccess('');
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )}

    </div>
  </HotelAdminDashboard>
  );
}
