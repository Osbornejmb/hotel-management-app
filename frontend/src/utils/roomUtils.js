import axios from 'axios';

// Returns true if the room with given roomNumber is currently booked/occupied
export async function isRoomBooked(roomNumber) {
  if (!roomNumber) return false;
  try {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/rooms`);
    const rooms = Array.isArray(res.data) ? res.data : [];
    const room = rooms.find(r => String(r.roomNumber) === String(roomNumber) || String(r.roomNumber).toLowerCase() === String(roomNumber).toLowerCase());
    if (!room) return false;
    const status = String(room.status || '').toLowerCase();
    // Treat 'booked' and similar as occupied for billing window
    const occupiedStatuses = new Set(['booked', 'checked in', 'checked_in', 'checked-in', 'occupied', 'in use']);
    return occupiedStatuses.has(status) || status.includes('book') || status.includes('check');
  } catch (err) {
    // On error, be conservative and disallow checkout
    return false;
  }
}

export default { isRoomBooked };
