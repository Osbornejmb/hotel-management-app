import React, { useEffect, useState } from 'react';
import HotelAdminDashboard from './HotelAdminDashboard';

function RoomCard({ room, onManage }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 4px 16px #bbb',
      padding: '1.1rem 1.1rem 0.7rem 1.1rem',
      margin: '1rem',
      width: '250px',
      minHeight: '200px',
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
      {/* Room status indicator below description, on its own line */}
      <div style={{ marginTop: '2.7rem' }} />
      <div style={{
        fontWeight: 700,
        fontSize: '1.08rem',
        color: room.status === 'booked' ? '#fff' : room.status === 'available' ? '#fff' : '#222',
        background: room.status === 'booked' ? '#e74c3c' : room.status === 'available' ? '#27ae60' : '#fff',
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
  // Handler for checkout button (calls backend to update room and customer status)
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
        // Refresh rooms list after successful checkout
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
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showUpdatedModal, setShowUpdatedModal] = useState(false);
  const [bookingCheckoutDate, setBookingCheckoutDate] = useState('');
  // State for extend stay
  const [extendDateTime, setExtendDateTime] = useState('');

  // Handler to update customer check-out in database
  const handleExtendStay = async () => {
    if (!extendDateTime || !selectedRoom) return;
    try {
      // Find the customer for this room (assumes only one active customer per room)
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/customers/extend`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomNumber: selectedRoom.roomNumber, newCheckout: extendDateTime })
      });
      if (res.ok) {
        setShowUpdatedModal(true);
        setExtendDateTime('');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to update: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Failed to update check-out.');
    }
  };
  // State for booking form
  const [bookingName, setBookingName] = useState('');
  const [bookingContact, setBookingContact] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Helper to update room status in state after booking
  const updateRoomStatus = (roomId, newStatus, guestName, guestContact) => {
    setRooms(prevRooms => prevRooms.map(r =>
      r._id === roomId ? { ...r, status: newStatus, guestName, guestContact } : r
    ));
  };

  // Book room handler
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
        // Do NOT close manage modal yet; wait for success modal to be dismissed
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
  // State for booking form
const [customerName, setCustomerName] = useState('');
const [customerContact, setCustomerContact] = useState('');
const [customerCheckinDate, setCustomerCheckinDate] = useState('');

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
  <div
    style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginTop: '2rem',
    }}
  >
    {loading ? (
      <div style={{ color: '#FFD700', fontWeight: 600 }}>Loading rooms...</div>
    ) : error ? (
      <div style={{ color: '#f44336', fontWeight: 600 }}>{error}</div>
    ) : rooms.length === 0 ? (
      <div style={{ color: '#FFD700', fontWeight: 600 }}>
        No rooms found in the database.
      </div>
    ) : (
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-start',
          paddingLeft: '15vw',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: '1.2rem',
            maxWidth: '1400px',
          }}
        >
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
      </div>
    )}
  </div>
</HotelAdminDashboard>

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
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Availability: <span style={{ fontWeight: 400 }}>{selectedRoom.status || 'N/A'}</span></div>
              {/* Form fields and dropdowns will go here */}
              <div style={{ marginTop: '1.5rem' }}>
                {selectedRoom.status === 'available' ? (
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
                ) : (
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ fontWeight: 600 }}>Extend Stay</label><br />
                      <input
                        type="date"
                        style={{ width: '100%', padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc' }}
                        value={extendDateTime || ''}
                        onChange={e => setExtendDateTime(e.target.value)}
                      />
                      <button
                        style={{ marginTop: 8, background: '#2980b9', color: '#fff', border: 'none', borderRadius: 7, padding: '0.4rem 1.2rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
                        onClick={handleExtendStay}
                        disabled={!extendDateTime}
                      >Update</button>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.2rem' }}>
                  {selectedRoom.status === 'booked' && (
                    <button
                      style={{ background: '#f44', color: '#fff', border: 'none', borderRadius: 7, padding: '0.6rem 1.5rem', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 2px 8px #fbb' }}
                      onClick={handleCheckout}
                    >Checkout</button>
                  )}
      {/* Done Checkout Modal */}
      {showCheckoutModal && (
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
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#27ae60', marginBottom: '1.2rem' }}>Done checkout!</div>
            <button onClick={() => setShowCheckoutModal(false)} style={{ background: '#27ae60', color: '#fff', border: 'none', borderRadius: 7, padding: '0.6rem 1.5rem', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', marginTop: '1rem' }}>OK</button>
          </div>
        </div>
      )}

      {/* Updated Checkout Date Modal */}
      {showUpdatedModal && (
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
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#2980b9', marginBottom: '1.2rem' }}>Checkout date updated!</div>
            <button onClick={() => setShowUpdatedModal(false)} style={{ background: '#2980b9', color: '#fff', border: 'none', borderRadius: 7, padding: '0.6rem 1.5rem', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', marginTop: '1rem' }}>OK</button>
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
      {/* Success Modal */}
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

                  {selectedRoom.status === 'under maintenance' && (
                    <button style={{ background: '#888', color: '#fff', border: 'none', borderRadius: 7, padding: '0.6rem 1.5rem', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 2px 8px #ccc' }}>Assign</button>
                  )}
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
