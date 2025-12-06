const express = require('express');
const router = express.Router();
const ActivityLog = require('./ActivityLog');

// Get all activity logs, newest first
router.get('/', async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// Get activity logs for a specific room by room document id
router.get('/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const logs = await ActivityLog.find({ collection: 'rooms', documentId: roomId }).sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity logs for room' });
  }
});

// Get activity logs for a room by roomNumber (convenience endpoint)
const Room = require('./Room');
router.get('/rooms/number/:roomNumber', async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const room = await Room.findOne({ roomNumber: { $regex: `^${roomNumber}$`, $options: 'i' } });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    const logs = await ActivityLog.find({ collection: 'rooms', documentId: room._id }).sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity logs for room number' });
  }
});

module.exports = router;
