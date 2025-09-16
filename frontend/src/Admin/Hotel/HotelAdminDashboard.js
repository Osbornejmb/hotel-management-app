
import React, { useState, useEffect } from 'react';
import './HotelAdminDashboard.css';
import LogoutButton from '../../Auth/LogoutButton';

function HotelAdminDashboard() {
  const [activeTab, setActiveTab] = useState('rooms');
  const [reservations, setReservations] = useState([]);
  // Book room handler
  const handleBookRoom = async (roomId) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'booked' })
      });
      if (response.ok) {
        // Refresh room list
        const updatedRooms = await fetch('/api/rooms');
        if (updatedRooms.ok) {
          const data = await updatedRooms.json();
          setRooms(data);
        }
      } else {
        alert('Failed to book room.');
      }
    } catch (error) {
      alert('Error booking room.');
      console.error(error);
    }
  };
  const [filterType, setFilterType] = useState('All');
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [amenities, setAmenities] = useState('');
  const [status, setStatus] = useState('available');
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    // Fetch all rooms from backend
    const fetchRooms = async () => {
      try {
        const response = await fetch('/api/rooms');
        if (response.ok) {
          const data = await response.json();
          setRooms(data);
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    if (activeTab === 'reservations') {
      const fetchReservations = async () => {
        try {
          const response = await fetch('/api/reservations');
          if (response.ok) {
            const data = await response.json();
            setReservations(data);
          }
        } catch (error) {
          console.error('Error fetching reservations:', error);
        }
      };
      fetchReservations();
    }
  }, [activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Frontend validation
    if (!roomNumber || !roomType || !status) {
      alert('All fields (room number, room type, status) are required.');
      return;
    }
    const roomData = {
      roomNumber,
      roomType,
      description,
      price: price ? Number(price) : 0,
      amenities: amenities ? amenities.split(',').map(a => a.trim()) : [],
      status
    };
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roomData),
      });
      const result = await response.json();
      if (response.ok) {
        alert('Room added successfully!');
  setRoomNumber('');
  setRoomType('');
  setDescription('');
  setPrice('');
  setAmenities('');
  setStatus('available');
        // Refresh room list
        const updatedRooms = await fetch('/api/rooms');
        if (updatedRooms.ok) {
          const data = await updatedRooms.json();
          setRooms(data);
        }
      } else {
        alert(result.error || 'Failed to add room.');
      }
    } catch (error) {
      alert('Error adding room.');
      console.error(error);
    }
  };

  return (
    <div style={{ background: '#111', minHeight: '100vh', color: '#FFD700', paddingBottom: '2rem' }}>
      <LogoutButton />
      <h2 style={{ color: '#FFD700', textShadow: '0 2px 8px #000', letterSpacing: '2px' }}>Hotel Admin Dashboard</h2>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
        <button onClick={() => setActiveTab('rooms')} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: activeTab === 'rooms' ? '2px solid #FFD700' : '2px solid #444', background: activeTab === 'rooms' ? '#FFD700' : '#222', color: activeTab === 'rooms' ? '#222' : '#FFD700', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', marginRight: '1rem', transition: 'background 0.2s, color 0.2s' }}>Rooms</button>
        <button onClick={() => setActiveTab('reservations')} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: activeTab === 'reservations' ? '2px solid #FFD700' : '2px solid #444', background: activeTab === 'reservations' ? '#FFD700' : '#222', color: activeTab === 'reservations' ? '#222' : '#FFD700', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}>Reservations</button>
      </div>
      {activeTab === 'rooms' && (
        <section>
          <h3 style={{ color: '#FFD700', textShadow: '0 2px 8px #000' }}>Room Availability</h3>
          {/* Add Room Form */}
          <form onSubmit={handleSubmit} style={{ background: '#222', padding: '2rem', borderRadius: '16px', boxShadow: '0 2px 16px #FFD700', color: '#FFD700', border: '2px solid #FFD700', marginBottom: '2rem' }}>
            {/* ...existing form fields... */}
          </form>
          {/* Add Room Form */}
          <form onSubmit={handleSubmit} style={{ background: '#222', padding: '2rem', borderRadius: '16px', boxShadow: '0 2px 16px #FFD700', color: '#FFD700', border: '2px solid #FFD700', marginBottom: '2rem' }}>
            <label style={{ color: '#FFD700' }}>
              Room Number:
              <input
                type="text"
                name="roomNumber"
                value={roomNumber}
                onChange={e => setRoomNumber(e.target.value)}
                style={{ borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', marginLeft: '1rem' }}
              />
            </label>
            <br />
            <label style={{ color: '#FFD700' }}>
              Room Type:
              <select
                name="roomType"
                value={roomType}
                onChange={e => setRoomType(e.target.value)}
                style={{ borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', marginLeft: '1rem' }}
              >
                <option value="">Select type</option>
                <option value="Standard">Standard</option>
                <option value="Deluxe">Deluxe</option>
              </select>
            </label>
            <br />
            <label style={{ color: '#FFD700' }}>
              Description:
              <input
                type="text"
                name="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', marginLeft: '1rem' }}
              />
            </label>
            <br />
            <label style={{ color: '#FFD700' }}>
              Price:
              <input
                type="number"
                name="price"
                value={price}
                onChange={e => setPrice(e.target.value)}
                style={{ borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', marginLeft: '1rem' }}
              />
            </label>
            <br />
            <label style={{ color: '#FFD700' }}>
              Amenities (comma separated):
              <input
                type="text"
                name="amenities"
                value={amenities}
                onChange={e => setAmenities(e.target.value)}
                style={{ borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', marginLeft: '1rem' }}
              />
            </label>
            <br />
            <label style={{ color: '#FFD700' }}>
              Status:
              <select
                name="status"
                value={status}
                onChange={e => setStatus(e.target.value)}
                style={{ borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', marginLeft: '1rem' }}
              >
                <option value="available">Available</option>
                <option value="booked">Booked</option>
              </select>
            </label>
            <br />
            <button type="submit" style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#FFD700', color: '#222', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s', marginTop: '1rem' }}
              onMouseOver={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}
              onMouseOut={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}>
              Add Room
            </button>
          </form>
          {/* Room Type Filter Buttons (centered above table) */}
          <div style={{ margin: '2em auto 1em auto', textAlign: 'center', maxWidth: '400px' }}>
            <button type="button" onClick={() => setFilterType('All')} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#222', color: '#FFD700', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', marginRight: '1rem', transition: 'background 0.2s, color 0.2s' }}
              onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
              onMouseOut={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}>Show All</button>
            <button type="button" onClick={() => setFilterType('Deluxe')} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#222', color: '#FFD700', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', marginRight: '1rem', transition: 'background 0.2s, color 0.2s' }}
              onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
              onMouseOut={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}>Show Deluxe</button>
            <button type="button" onClick={() => setFilterType('Standard')} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#222', color: '#FFD700', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
              onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
              onMouseOut={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}>Show Standard</button>
          </div>
          {/* Room List Table */}
          <h4 style={{ color: '#FFD700', textShadow: '0 2px 8px #000' }}>All Rooms</h4>
          <table border="1" cellPadding="8" style={{ marginTop: '1em', width: '100%', borderCollapse: 'collapse', background: '#222', color: '#FFD700', boxShadow: '0 2px 16px #FFD700', border: '2px solid #FFD700' }}>
            <thead>
              <tr style={{ background: '#FFD700', color: '#222' }}>
                <th>Room Number</th>
                <th>Room Type</th>
                <th>Description</th>
                <th>Price</th>
                <th>Amenities</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rooms.length === 0 ? (
                <tr><td colSpan="6">No rooms found.</td></tr>
              ) : (
                rooms
                  .filter(room => filterType === 'All' || room.roomType === filterType)
                  .map(room => (
                    <tr key={room._id} style={{ background: '#222', color: '#FFD700' }}>
                      <td>{room.roomNumber}</td>
                      <td>{room.roomType}</td>
                      <td>{room.description}</td>
                      <td>{room.price}</td>
                      <td>{Array.isArray(room.amenities) ? room.amenities.join(', ') : ''}</td>
                      <td>
                        {room.status}
                        {room.status === 'available' && (
                          <button
                            style={{ marginLeft: '1em', padding: '0.3rem 0.8rem', borderRadius: '6px', border: '2px solid #FFD700', background: '#FFD700', color: '#222', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
                            onClick={() => handleBookRoom(room._id)}
                            onMouseOver={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}
                            onMouseOut={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}>
                            Book
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </section>
      )}
      {activeTab === 'reservations' && (
        <section>
          <h3 style={{ color: '#FFD700', textShadow: '0 2px 8px #000' }}>Reservations</h3>
          <table border="1" cellPadding="8" style={{ marginTop: '1em', width: '100%', borderCollapse: 'collapse', background: '#222', color: '#FFD700', boxShadow: '0 2px 16px #FFD700', border: '2px solid #FFD700' }}>
            <thead>
              <tr style={{ background: '#FFD700', color: '#222' }}>
                <th>Name</th>
                <th>Room</th>
                <th>Date</th>
                <th>Time</th>
                <th>Amenity</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr><td colSpan="5">No reservations found.</td></tr>
              ) : (
                reservations.map(reservation => (
                  <tr key={reservation._id} style={{ background: '#222', color: '#FFD700' }}>
                    <td>{reservation.name}</td>
                    <td>{reservation.room}</td>
                    <td>{reservation.date}</td>
                    <td>{reservation.time}</td>
                    <td>{reservation.amenity}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

export default HotelAdminDashboard;
