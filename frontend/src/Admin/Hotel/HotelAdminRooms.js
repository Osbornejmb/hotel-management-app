import React, { useEffect, useState } from 'react';
import HotelAdminDashboard from './HotelAdminDashboard';
import './HotelAdminRooms.css';

function getRoomCardColor(status, type) {
  return 'room-card-gray';
}

export default function HotelAdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalRoom, setModalRoom] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, jobType: '', room: null });
  const [activityLogs, setActivityLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  // Note: removed floor/type selection to show all rooms in a single scrollable view
  

  useEffect(() => {
    async function fetchRooms() {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/rooms`);
        if (!res.ok) throw new Error('Failed to fetch rooms');
  const data = await res.json();
  setRooms(Array.isArray(data) ? data : data.rooms || []);
      } catch (err) {
        setError('Could not load rooms.');
      } finally {
        setLoading(false);
      }
    }
    fetchRooms();
  }, []);

  // Show all rooms (no sorting/filtering) but ensure we only render entries with a roomNumber
  const filteredRooms = rooms.filter(r => r && r.roomNumber);

  // Group and sort rooms by floor (e.g., 101 -> floor 1, 201 -> floor 2)
  const roomsSorted = [...filteredRooms].sort((a, b) => {
    const aNum = Number(a.roomNumber);
    const bNum = Number(b.roomNumber);
    const aFloor = Math.floor(aNum / 100);
    const bFloor = Math.floor(bNum / 100);
    if (aFloor !== bFloor) return aFloor - bFloor;
    return aNum - bNum;
  });

  const floors = Array.from(new Set(roomsSorted.map(r => Math.floor(Number(r.roomNumber) / 100))));
  const [currentFloorIndex, setCurrentFloorIndex] = useState(0);
  const currentFloor = floors[currentFloorIndex];
  const roomsForCurrentFloor = roomsSorted.filter(r => Math.floor(Number(r.roomNumber) / 100) === currentFloor);

  // Fetch activity logs for the selected room
  useEffect(() => {
    if (!modalRoom) return;
    setLogsLoading(true);
    fetch(`${process.env.REACT_APP_API_URL}/api/activitylogs`)
      .then(res => res.json())
      .then(data => {
        // Filter logs for this room only
        const logs = Array.isArray(data)
          ? data.filter(log => log.collection === 'rooms' && log.details && (log.details.roomNumber === modalRoom.roomNumber || log.documentId === modalRoom._id))
          : [];
        setActivityLogs(logs);
      })
      .catch(() => setActivityLogs([]))
      .finally(() => setLogsLoading(false));
  }, [modalRoom]);

  return (
    <HotelAdminDashboard>
      <div className="hotel-admin-rooms-content">
        {loading ? (
          <div className="hotel-admin-rooms-loading">Loading rooms...</div>
        ) : error ? (
          <div className="hotel-admin-rooms-error">{error}</div>
        ) : (
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '0.8rem', gap: '8px' }}>
              <label htmlFor="floor-select" style={{ fontWeight: 700, color: '#444' }}>Floor</label>
              <select
                id="floor-select"
                className="floor-select"
                value={currentFloorIndex}
                onChange={e => setCurrentFloorIndex(Number(e.target.value))}
              >
                {floors.map((f, idx) => (
                  <option key={f} value={idx}>{`Floor ${f}`}</option>
                ))}
              </select>
              <button
                className="rooms-nav-btn"
                onClick={() => setCurrentFloorIndex(i => Math.max(0, i - 1))}
                disabled={currentFloorIndex <= 0}
                aria-label="Previous Floor"
              >
                ‹
              </button>
              <button
                className="rooms-nav-btn"
                onClick={() => setCurrentFloorIndex(i => Math.min(floors.length - 1, i + 1))}
                disabled={currentFloorIndex >= floors.length - 1}
                aria-label="Next Floor"
              >
                ›
              </button>
            </div>

            <div className="rooms-scroll-wrapper">
              <div className="hotel-admin-rooms-grid">
                {roomsForCurrentFloor.map(room => (
                  <div key={room._id} className={`room-card-v2 ${getRoomCardColor(room.status, room.roomType)}`}>
                <div style={{display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.2rem'}}>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0}}>
                    <div className="room-card-v2-number">{room.roomNumber}</div>
                    <div className={`room-card-v2-status room-card-v2-status-${room.status ? room.status.toLowerCase() : (room.isBooked ? 'booked' : 'available')}`}>
                      {room.status
                        ? room.status.charAt(0).toUpperCase() + room.status.slice(1)
                        : (room.isBooked ? 'Booked' : 'Available')}
                    </div>
                    {room.description && (
                      <div
                        className="room-card-v2-desc-below-status"
                        style={{
                          fontSize: '0.95em',
                          color: '#666',
                          marginTop: '0.2em',
                          marginBottom: '0.2em',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          width: '100%'
                        }}
                      >
                        {room.description}
                      </div>
                    )}
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                    <div className="room-card-v2-type-upper">{room.roomType}</div>
                  </div>
                </div>
                <div className="room-card-v2-amenities">
                  <b>Amenities:</b>
                  {room.amenities && room.amenities.length > 0 ? (
                    <ul className="room-card-v2-list room-card-v2-list-scrollable">
                      {room.amenities.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  ) : (
                    <span> None</span>
                  )}
                </div>
                <button className="room-card-v2-manage" onClick={() => setModalRoom(room)}>Manage</button>
                </div>
                ))}
              </div> {/* close hotel-admin-rooms-grid */}
            </div> {/* close rooms-scroll-wrapper */}



          </div>
        )}
        {/* Filters removed: showing all rooms in a single scrollable grid to avoid layout/sorting issues for now */}
        {/* Modal Placeholder */}
        {modalRoom && (
          <div className="room-modal-backdrop" onClick={() => setModalRoom(null)}>
            <div className="room-modal" onClick={e => e.stopPropagation()}>
              <button className="room-modal-close" onClick={() => setModalRoom(null)}>×</button>
              <h3 className="room-modal-title">Room {modalRoom.roomNumber}</h3>

              <div className="room-modal-section">
                <div><strong>Room Type:</strong> {modalRoom.roomType}</div>
                <div><strong>Description:</strong> {modalRoom.description || ''}</div>
                <div><strong>Status:</strong> {modalRoom.status
                  ? modalRoom.status.charAt(0).toUpperCase() + modalRoom.status.slice(1)
                  : (modalRoom.isBooked ? 'Booked' : 'Available')}</div>
                <div><strong>Price:</strong> {modalRoom.price ? `₱${modalRoom.price}` : 'N/A'}</div>
                <div><strong>Amenities:</strong> {modalRoom.amenities?.join(', ') || 'None'}</div>
              </div>

              <div className="room-modal-actions-right">
                {modalRoom.status && modalRoom.status.toLowerCase().includes('cleaning') && (
                  <button
                    className="modal-btn request-cleaning"
                    onClick={() => setConfirmModal({ open: true, jobType: 'cleaning', room: modalRoom })}
                  >
                    Request Cleaning
                  </button>
                )}
                {modalRoom.status && modalRoom.status.toLowerCase().includes('maintenance') && (
                  <button
                    className="modal-btn request-maintenance"
                    onClick={() => setConfirmModal({ open: true, jobType: 'maintenance', room: modalRoom })}
                  >
                    Request Maintenance
                  </button>
                )}
              </div>

              <div className="room-modal-log expanded">
                <h4>Activity Log</h4>
                {logsLoading ? (
                  <div>Loading activity logs...</div>
                ) : activityLogs.length === 0 ? (
                  <div>No activity found for this room.</div>
                ) : (
                  <ul>
                    {activityLogs.map(log => (
                      <li key={log._id}>
                        <b>{log.actionType.charAt(0).toUpperCase() + log.actionType.slice(1)}</b> —
                        {log.details && log.details.roomNumber ? ` Room ${log.details.roomNumber}` : ''}
                        {log.details && log.details.status ? `, Status: ${log.details.status}` : ''}
                        <span style={{ color: '#888', marginLeft: 8 }}>
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmModal.open && (
          <RequestModal
            jobType={confirmModal.jobType}
            room={confirmModal.room}
            onClose={() => setConfirmModal({ open: false, jobType: '', room: null })}
          />
        )}
      </div>
    </HotelAdminDashboard>
  );
}

// RequestModal must be outside HotelAdminRooms
function RequestModal({ jobType, room, onClose }) {
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleConfirm() {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber: room.roomNumber,
          jobType,
          date: new Date(),
          priority
        })
      });
      if (!res.ok) throw new Error('Failed to submit request');
      setSuccess('Request submitted successfully!');
      setTimeout(onClose, 1200);
    } catch (err) {
      setError('Could not submit request.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="room-modal-backdrop" style={{zIndex: 2000}}>
      <div className="room-modal" style={{maxWidth: 350, textAlign: 'center'}}>
        <h4>Confirm {jobType === 'cleaning' ? 'Cleaning' : 'Maintenance'} Request</h4>
        <p>Room: <b>{room?.roomNumber}</b></p>
        <div style={{ margin: '1em 0' }}>
          <label htmlFor="priority-select"><b>Priority:</b></label>
          <select
            id="priority-select"
            value={priority}
            onChange={e => setPriority(e.target.value)}
            style={{ marginLeft: 8, padding: '0.3em', borderRadius: 4 }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        {success && <div style={{ color: 'green', marginBottom: 8 }}>{success}</div>}
        <div className="modal-actions">
          <button onClick={onClose} disabled={loading}>Cancel</button>
          <button onClick={handleConfirm} disabled={loading} style={{ background: '#a57c2b', color: '#fff' }}>
            {loading ? 'Submitting...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
