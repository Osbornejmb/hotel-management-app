 import React, { useEffect, useState, useRef } from 'react';
import HotelAdminDashboard from './HotelAdminDashboard';
import './HotelAdminRooms.css';
import { io } from 'socket.io-client';

function getRoomCardColor(status, type) {
  return 'room-card-gray';
}

export default function HotelAdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalRoom, setModalRoom] = useState(null);
  const modalRoomRef = useRef(null);
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

  // Fetch activity logs for the selected room, subscribe to real-time updates, and poll as fallback
  useEffect(() => {
    if (!modalRoom) return;
    setLogsLoading(true);
    const roomId = modalRoom._id;
    let mounted = true;
    const fetchLogs = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/activitylogs/rooms/${roomId}`);
        if (!res.ok) {
          if (mounted) setActivityLogs([]);
          return [];
        }
        const activityData = await res.json();
        if (!mounted) return [];
        const logs = Array.isArray(activityData) ? activityData.filter(log => {
          if (!log) return false;
          if (log.change && log.change.field === 'status') return true;
          if (log.details && (log.details.status || log.details.newStatus)) return true;
          if (String(log.actionType || '').toLowerCase().includes('book')) return true;
          return false;
        }) : [];
        const sorted = logs
          .filter(l => l && l.timestamp)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        if (mounted) setActivityLogs(sorted);
        return sorted;
      } catch (err) {
        if (mounted) setActivityLogs([]);
        return [];
      } finally {
        if (mounted) setLogsLoading(false);
      }
    };

    // initial fetch
    fetchLogs();

    // socket listener to update modal in real time
    const socket = io(process.env.REACT_APP_API_URL || '/', { transports: ['websocket', 'polling'] });
    const onRoomChange = (payload) => {
      try {
        if (!payload) return;
        const payloadRoomId = payload.roomId || payload._id || null;
        const payloadRoomNumber = payload.roomNumber || payload.room || null;
        if (String(payloadRoomId) === String(roomId) || String(payloadRoomNumber) === String(modalRoom.roomNumber)) {
          fetchLogs();
        }
      } catch (err) {}
    };
    socket.on('roomStatusChanged', onRoomChange);

    // polling fallback every 15s
    const pollInterval = setInterval(() => fetchLogs(), 15000);

    return () => {
      mounted = false;
      try { socket.off('roomStatusChanged', onRoomChange); socket.disconnect(); } catch (err) {}
      clearInterval(pollInterval);
    };
  }, [modalRoom]);

  // Keep a ref to modalRoom for use inside socket handler
  useEffect(() => { modalRoomRef.current = modalRoom; }, [modalRoom]);

  // Socket listener to update rooms list in real-time so UI reflects status changes without reload
  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL || '/', { transports: ['websocket', 'polling'] });
    const handler = (payload) => {
      try {
        if (!payload) return;
        const pid = payload.roomId || payload._id || null;
        const pnum = payload.roomNumber || payload.room || null;
        setRooms(prev => prev.map(r => {
          if (String(r._id) === String(pid) || (pnum && String(r.roomNumber) === String(pnum))) {
            return { ...r, status: payload.status || r.status };
          }
          return r;
        }));

        // also update modalRoom if it's the same room
        const currentModal = modalRoomRef.current;
        if (currentModal && (String(currentModal._id) === String(pid) || (pnum && String(currentModal.roomNumber) === String(pnum)))) {
          setModalRoom(prev => ({ ...prev, status: payload.status || prev.status }));
        }
      } catch (err) {}
    };
    socket.on('roomStatusChanged', handler);
    return () => { try { socket.off('roomStatusChanged', handler); socket.disconnect(); } catch (err) {} };
  }, []);

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
                {modalRoom.status && modalRoom.status.toLowerCase() === 'checked-out' && (
                  <>
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
                  </>
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
                        <b>{String(log.actionType || '').charAt(0).toUpperCase() + String(log.actionType || '').slice(1)}</b>
                        {log.details && log.details.roomNumber ? ` — Room ${log.details.roomNumber}` : ''}
                        {log.change ? ` — ${log.change.oldValue || ''} → ${log.change.newValue || ''}` : (log.details && (log.details.status || log.details.newStatus) ? ` — ${log.details.status || log.details.newStatus}` : '')}
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
    <div className="room-modal-backdrop" style={{ zIndex: 2000 }}>
      <div className="room-modal request-modal" role="dialog" aria-modal="true">
        <div className="request-modal-header">
          <div>
            <div className="request-modal-title">Confirm {jobType === 'cleaning' ? 'Cleaning' : 'Maintenance'} Request</div>
            <div className="request-modal-sub">Room <strong>{room?.roomNumber}</strong></div>
          </div>
          <button className="room-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="request-modal-body">
          <div className="request-form-row">
            <label htmlFor="priority-select">Priority</label>
            <select id="priority-select" className="request-select" value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {error && <div className="request-status request-error">{error}</div>}
          {success && <div className="request-status request-success">{success}</div>}

          <div className="request-actions">
            <button className="modal-btn secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button className="modal-btn primary" onClick={handleConfirm} disabled={loading}>
              {loading ? 'Submitting...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
