const express = require('express');
const router = express.Router();
const Room = require('./Room');

// Add new room
router.post('/api/rooms', async (req, res) => {
	try {
		const newRoom = new Room(req.body);
		await newRoom.save();
		res.status(201).json({ message: 'Room added successfully' });
	} catch (error) {
		res.status(500).json({ message: 'Error adding room', error });
	}
});

module.exports = router;
