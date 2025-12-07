import axios from 'axios';

// Returns true if the room with given roomNumber is currently occupied
// Only 'occupied' status allows checkout
export async function isRoomBooked(roomNumber) {
  if (!roomNumber) return false;
  try {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/rooms`);
    const rooms = Array.isArray(res.data) ? res.data : [];
    const room = rooms.find(r => String(r.roomNumber) === String(roomNumber) || String(r.roomNumber).toLowerCase() === String(roomNumber).toLowerCase());
    if (!room) return false;
    const status = String(room.status || '').toLowerCase();
    // Only 'occupied' status allows checkout (billing window is only when room is occupied)
    return status === 'occupied';
  } catch (err) {
    // On error, be conservative and disallow checkout
    return false;
  }
}

export default { isRoomBooked };
