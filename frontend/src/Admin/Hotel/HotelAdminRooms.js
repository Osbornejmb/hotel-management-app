import React, { useEffect, useState } from 'react';
import HotelAdminDashboard from './HotelAdminDashboard';
import './RoomCard.css';
import './HotelAdminRooms.css';

function RoomCard({ room, onManage }) {
  return (
    <div className="room-card">
      <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#444', textShadow: '0 2px 8px #ccc', lineHeight: 1 }}>{room.roomNumber}</div>
      <div style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', fontWeight: 500, color: '#444', fontSize: '1.1rem', textAlign: 'right' }}>
        {room.roomType} <br />
        <span style={{ fontSize: '0.95rem', color: '#222', fontWeight: 400 }}>({room.description || '2 pax'})</span>
      </div>
      {/* Room status indicator below description, on its own line */}
      <div style={{ marginTop: '2.7rem' }} />
      <div style={{
        fontWeight: 700,
        fontSize: '1.08rem',
        color: room.status === 'booked' ? '#fff' : room.status === 'available' ? '#fff' : '#222',
  background: room.status === 'booked' ? '#e74c3c' : room.status === 'available' ? '#27ae60' : 'transparent',
        border: room.status === 'under maintenance' ? '1px solid #bbb' : 'none',
        borderRadius: 7,
        padding: '0.18rem 0.7rem',
        display: 'inline-block',
        boxShadow: room.status === 'under maintenance' ? '0 2px 8px #eee' : '0 2px 8px #ccc',
        marginBottom: '0.5rem',
        marginLeft: 0,
      }}>
        {room.status === 'booked' && 'Booked'}
        {room.status === 'available' && 'Available'}
        {room.status === 'under maintenance' && 'Under Maintenance'}
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
  // Fetch all employees on initial load
  useEffect(() => {
    async function fetchAllEmployees() {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/employees`);
        if (res.ok) {
          const data = await res.json();
          setEmployees(data);
        }
      } catch (err) {}
    }
    fetchAllEmployees();
  }, []);

  const [job, setJob] = useState('Housekeeping');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/employees?department=${job}`);
        if (res.ok) {
          const data = await res.json();
          setEmployees(data);
          setSelectedEmployee(data[0]?.fullName || '');
        }
      } catch (err) {}
    }
    fetchEmployees();
  }, [job]);

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showUpdatedModal, setShowUpdatedModal] = useState(false);
  const [bookingCheckoutDate, setBookingCheckoutDate] = useState('');
  const [extendDateTime, setExtendDateTime] = useState('');
  const [bookingName, setBookingName] = useState('');
  const [bookingContact, setBookingContact] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchRooms() {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/rooms`);
        if (!res.ok) throw new Error('Failed to fetch rooms');
        const data = await res.json();
        console.log('Fetched rooms:', data);
        setRooms(data);
      } catch (err) {
        setError('Could not load rooms.');
      } finally {
        setLoading(false);
      }
    }
    fetchRooms();
  }, []);

  const updateRoomStatus = (roomId, newStatus, guestName, guestContact) => {
    setRooms(prevRooms => prevRooms.map(r =>
      r._id === roomId ? { ...r, status: newStatus, guestName, guestContact } : r
    ));
  };

  const handleBookRoom = async () => {
    if (!bookingName || !bookingContact || !bookingCheckoutDate) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/rooms/${selectedRoom._id}/book`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestName: bookingName, guestContact: bookingContact, checkoutDate: bookingCheckoutDate })
      });
      if (res.ok) {
        updateRoomStatus(selectedRoom._id, 'booked', bookingName, bookingContact);
        setShowSuccessModal(true);
        setBookingName('');
        setBookingContact('');
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Booking failed:', errorData);
        alert(`Booking failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Booking failed.');
    }
  };

  const handleCheckout = async () => {
    if (!selectedRoom) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/checkout/checkout`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomNumber: selectedRoom.roomNumber })
      });
      if (res.ok) {
        setShowCheckoutModal(true);
        const roomsRes = await fetch(`${process.env.REACT_APP_API_URL}/api/rooms`);
        if (roomsRes.ok) {
          const data = await roomsRes.json();
          setRooms(data);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Checkout failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Checkout failed.');
    }
  };

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'extend' or 'checkout'

  const [showActionSuccess, setShowActionSuccess] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  const handleExtendStay = async () => {
    if (!extendDateTime || !selectedRoom) return;
    setConfirmAction('extend');
    setShowConfirmModal(true);
  };

  const handleCheckoutWithConfirm = async () => {
    setConfirmAction('checkout');
    setShowConfirmModal(true);
  };

  // Actually perform the confirmed action
  const doConfirmedAction = async () => {
    if (confirmAction === 'extend') {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/customers/extend`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomNumber: selectedRoom.roomNumber, newCheckout: extendDateTime })
        });
        if (res.ok) {
          setShowUpdatedModal(false);
          setExtendDateTime('');
          setShowActionSuccess(true);
          setActionSuccessMessage('Checkout date updated successfully!');
        } else {
          const errorData = await res.json().catch(() => ({}));
          alert(`Failed to update: ${errorData.error || 'Unknown error'}`);
        }
      } catch (err) {
        alert('Failed to update check-out.');
      }
    } else if (confirmAction === 'checkout') {
      if (!selectedRoom) return;
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/checkout/checkout`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomNumber: selectedRoom.roomNumber })
        });
        if (res.ok) {
          const roomsRes = await fetch(`${process.env.REACT_APP_API_URL}/api/rooms`);
          if (roomsRes.ok) {
            const data = await roomsRes.json();
            setRooms(data);
          }
          setShowCheckoutModal(false);
          setShowActionSuccess(true);
          setActionSuccessMessage('Checked out successfully!');
        } else {
          const errorData = await res.json().catch(() => ({}));
          alert(`Checkout failed: ${errorData.error || 'Unknown error'}`);
        }
      } catch (err) {
        alert('Checkout failed.');
      }
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
  };
      {/* Success Confirmation Modal */}
      {showActionSuccess && (
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
          zIndex: 4000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 8px 32px #888',
            padding: '2.5rem 2.5rem 2rem 2.5rem',
            minWidth: '320px',
            maxWidth: '95vw',
            position: 'relative',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#27ae60', marginBottom: '1.2rem' }}>{actionSuccessMessage}</div>
            <button onClick={() => { setShowActionSuccess(false); setShowModal(false); }} style={{ background: '#27ae60', color: '#fff', border: 'none', borderRadius: 7, padding: '0.6rem 1.5rem', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', marginTop: '1rem' }}>OK</button>
          </div>
        </div>
      )}

  return (
    <HotelAdminDashboard>
  <div className="hotel-admin-rooms-container">
        {loading ? (
          <div style={{ color: '#FFD700', fontWeight: 600 }}>Loading rooms...</div>
        ) : error ? (
          <div style={{ color: '#f44336', fontWeight: 600 }}>{error}</div>
        ) : rooms.length === 0 ? (
          <div style={{ color: '#FFD700', fontWeight: 600 }}>
            No rooms found in the database.
          </div>
        ) : (
          <div className="hotel-admin-rooms-grid">
            {rooms.slice(0, 10).map((room) => (
              <RoomCard
                key={room._id}
                room={room}
                onManage={(room) => {
                  setSelectedRoom(room);
                  setShowModal(true);
                }}
              />
            ))}
          </div>
        )}

        {/* Modal for managing room */}
        {showModal && selectedRoom && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
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
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Availability: <span style={{ fontWeight: 400 }}>{selectedRoom.status || 'N/A'}</span></div>
              
              <div style={{ marginTop: '1.5rem' }}>
                {selectedRoom.status === 'available' && (
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ fontWeight: 600 }}>Guest Name</label><br />
                      <input
                        type="text"
                        style={{ width: '100%', padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc' }}
                        placeholder="Enter guest name"
                        value={bookingName}
                        onChange={e => setBookingName(e.target.value)}
                      />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ fontWeight: 600 }}>Contact Number</label><br />
                      <input
                        type="text"
                        style={{ width: '100%', padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc' }}
                        placeholder="Enter contact number"
                        value={bookingContact}
                        onChange={e => setBookingContact(e.target.value)}
                      />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ fontWeight: 600 }}>Check-out Date</label><br />
                      <input
                        type="date"
                        style={{ width: '100%', padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc' }}
                        value={bookingCheckoutDate || ''}
                        onChange={e => setBookingCheckoutDate(e.target.value)}
                      />
                    </div>
                  </>
                )}
                {selectedRoom.status === 'booked' && (
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ fontWeight: 600 }}>Extend Stay (New Checkout Date & Time)</label><br />
                      <input
                        type="date"
                        style={{ width: '100%', padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc' }}
                        value={extendDateTime}
                        onChange={e => setExtendDateTime(e.target.value)}
                      />
                      <button style={{ background: '#2980b9', color: '#fff', border: 'none', borderRadius: 7, padding: '0.4rem 1.2rem', fontWeight: 600, marginTop: '0.5rem', cursor: 'pointer' }} onClick={handleExtendStay} disabled={!extendDateTime}>Extend Stay</button>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.2rem' }}>
                  {selectedRoom.status === 'booked' && (
                    <button
                      style={{ background: '#f44', color: '#fff', border: 'none', borderRadius: 7, padding: '0.6rem 1.5rem', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 2px 8px #fbb' }}
                      onClick={handleCheckoutWithConfirm}
                    >Checkout</button>
                  )}
      {/* Confirmation Modal (moved outside modal content for correct JSX structure) */}
      {showConfirmModal && (
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
          zIndex: 3000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 8px 32px #888',
            padding: '2rem 2.5rem',
            minWidth: '320px',
            maxWidth: '95vw',
            position: 'relative',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#222', marginBottom: '1.2rem' }}>
              {confirmAction === 'extend' ? 'Confirm update checkout date?' : 'Confirm checkout?'}
            </div>
            <div style={{ marginBottom: '1.2rem', color: '#444' }}>
              {confirmAction === 'extend'
                ? `Are you sure you want to update the checkout date to ${extendDateTime}?`
                : 'Are you sure you want to check out this room?'}
            </div>
            <button onClick={doConfirmedAction} style={{ background: '#27ae60', color: '#fff', border: 'none', borderRadius: 7, padding: '0.6rem 1.5rem', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', marginRight: '1rem' }}>Yes</button>
            <button onClick={() => { setShowConfirmModal(false); setConfirmAction(null); }} style={{ background: '#f44', color: '#fff', border: 'none', borderRadius: 7, padding: '0.6rem 1.5rem', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer' }}>No</button>
          </div>
        </div>
  )}
                  {selectedRoom.status === 'available' && (
                    <button
                      style={{ background: '#2ecc40', color: '#fff', border: 'none', borderRadius: 7, padding: '0.6rem 1.5rem', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 2px 8px #bfb' }}
                      onClick={handleBookRoom}
                      disabled={!bookingName || !bookingContact}
                    >
                      Book
                    </button>
                  )}
                </div>

                {showSuccessModal && (
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
                    zIndex: 2000
                  }}>
                    <div style={{
                      background: '#fff',
                      borderRadius: '16px',
                      boxShadow: '0 8px 32px #888',
                      padding: '2.5rem 2.5rem 2rem 2.5rem',
                      minWidth: '320px',
                      maxWidth: '95vw',
                      position: 'relative',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#27ae60', marginBottom: '1.2rem' }}>Booked successfully!</div>
                      <button onClick={() => { setShowSuccessModal(false); setShowModal(false); }} style={{ background: '#27ae60', color: '#fff', border: 'none', borderRadius: 7, padding: '0.6rem 1.5rem', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', marginTop: '1rem' }}>OK</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </HotelAdminDashboard>
  );
}

export default HotelAdminRooms;
