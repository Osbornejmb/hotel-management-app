console.log('roomRoutes loaded');
const express = require('express');
const router = express.Router();
const Room = require('./Room');

// Add new room
// Register a new room
// Get all rooms
router.get('/', async (req, res) => {
	try {
		const rooms = await Room.find();
		res.json(rooms);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Register a new room
router.post('/', async (req, res) => {
	try {
		const { roomNumber, roomType, status } = req.body;
		// Validate required fields
		if (!roomNumber || !roomType || !status) {
			return res.status(400).json({ error: 'All fields (roomNumber, roomType, status) are required.' });
		}
		// Check for duplicate room number
		const existingRoom = await Room.findOne({ roomNumber });
		if (existingRoom) {
			return res.status(400).json({ error: 'A room with that number already exists.' });
		}
		const newRoom = new Room({ roomNumber, roomType, status });
		await newRoom.save();
		res.status(201).json({ message: 'Room added successfully' });
	} catch (err) {
		// Validation errors
		if (err.name === 'ValidationError') {
			const messages = Object.values(err.errors).map(e => e.message);
			return res.status(400).json({ error: messages.join(' ') });
		}
		// Log error for debugging
		console.error('Room registration error:', err);
		res.status(400).json({ error: err.message || 'Room registration failed' });
	}
});

module.exports = router;
