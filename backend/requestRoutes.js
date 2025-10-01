const express = require('express');
const router = express.Router();
const Request = require('./Request');

// Create a new request
router.post('/', async (req, res) => {
  try {
    const { roomName, roomNumber, jobType, date, priority } = req.body;
    console.log('REQUEST PAYLOAD:', req.body);
    const finalRoomNumber = roomNumber || roomName;
    // Generate a unique taskId (e.g., T + timestamp + random)
    const taskId = 'T' + Date.now() + Math.floor(Math.random() * 1000);
    const request = new Request({
      taskId,
      roomNumber: finalRoomNumber,
      jobType,
      date,
      priority
    });
    await request.save();
    res.status(201).json(request);
  } catch (err) {
    console.error('REQUEST ERROR:', err);
    res.status(500).json({ error: 'Failed to create request', details: err.message });
  }
});

// Get all requests
router.get('/', async (req, res) => {
	try {
		const requests = await Request.find().sort({ date: -1 });
		res.json(requests);
	} catch (err) {
		res.status(500).json({ error: 'Failed to fetch requests' });
	}
});

module.exports = router;
