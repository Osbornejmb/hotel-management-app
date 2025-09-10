
import React, { useState, useEffect } from 'react';
import LogoutButton from '../../Auth/LogoutButton';

function HotelAdminDashboard() {
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
      price: price ? Number(price) : undefined,
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
    <div>
      <LogoutButton />
      <h2>Hotel Admin Dashboard</h2>
      <section>
        <h3>Room Availability</h3>
        {/* Add Room Form */}
        <form onSubmit={handleSubmit}>
          <label>
            Room Number:
            <input
              type="text"
              name="roomNumber"
              value={roomNumber}
              onChange={e => setRoomNumber(e.target.value)}
            />
          </label>
          <br />
          <label>
            Room Type:
            <select
              name="roomType"
              value={roomType}
              onChange={e => setRoomType(e.target.value)}
            >
              <option value="">Select type</option>
              <option value="Standard">Standard</option>
              <option value="Deluxe">Deluxe</option>
            </select>
          </label>
          <br />
          <label>
            Description:
            <input
              type="text"
              name="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </label>
          <br />
          <label>
            Price:
            <input
              type="number"
              name="price"
              value={price}
              onChange={e => setPrice(e.target.value)}
            />
          </label>
          <br />
          <label>
            Amenities (comma separated):
            <input
              type="text"
              name="amenities"
              value={amenities}
              onChange={e => setAmenities(e.target.value)}
            />
          </label>
          <br />
          <label>
            Status:
            <select
              name="status"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="available">Available</option>
              <option value="booked">Booked</option>
            </select>
          </label>
          <br />
          <button type="submit">Add Room</button>
        </form>
        {/* Room List Table */}
        <h4>All Rooms</h4>
        <table border="1" cellPadding="8" style={{ marginTop: '1em', width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
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
              rooms.map(room => (
                <tr key={room._id}>
                  <td>{room.roomNumber}</td>
                  <td>{room.roomType}</td>
                  <td>{room.description}</td>
                  <td>{room.price}</td>
                  <td>{Array.isArray(room.amenities) ? room.amenities.join(', ') : ''}</td>
                  <td>{room.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default HotelAdminDashboard;
