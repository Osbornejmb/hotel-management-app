
const express = require('express');
const router = express.Router();
const Room = require('./Room');
console.log('roomRoutes loaded');

// Update room status (book room)
router.patch('/:id', async (req, res) => {
	try {
		const { status } = req.body;
		const room = await Room.findByIdAndUpdate(
			req.params.id,
			{ status },
			{ new: true }
		);
		if (!room) {
			return res.status(404).json({ error: 'Room not found' });
		}
		res.json({ message: 'Room status updated', room });
	} catch (err) {
		console.error('Room update error:', err);
		res.status(400).json({ error: err.message || 'Room update failed' });
	}
});


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
			const { roomNumber, roomType, status, description, price, amenities } = req.body;
			// Validate required fields
			if (!roomNumber || !roomType || !status) {
				return res.status(400).json({ error: 'All fields (roomNumber, roomType, status) are required.' });
			}
			// Check for duplicate room number
			const existingRoom = await Room.findOne({ roomNumber });
			if (existingRoom) {
				return res.status(400).json({ error: 'A room with that number already exists.' });
			}
			const newRoom = new Room({
				roomNumber,
				roomType,
				status,
				description: description || '',
				price: typeof price === 'number' ? price : (price ? Number(price) : 0),
				amenities: Array.isArray(amenities) ? amenities : (amenities ? amenities.split(',').map(a => a.trim()) : [])
			});
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


// Validate room number
router.post('/validate', async (req, res) => {
	const { roomNumber } = req.body;
	if (!roomNumber) {
		return res.status(400).json({ valid: false, error: 'Room number required.' });
	}
	try {
		const room = await Room.findOne({ roomNumber });
		if (room) {
			return res.json({ valid: true });
		} else {
			return res.json({ valid: false, error: 'Room not found.' });
		}
	} catch (err) {
		return res.status(500).json({ valid: false, error: err.message });
	}
});


// Customer room validation (POST /api/rooms/validate)
router.post('/validate', async (req, res) => {
	let { roomNumber } = req.body;
	console.log('Received roomNumber for validation:', roomNumber);
	if (!roomNumber) {
		return res.status(400).json({ valid: false, error: 'Room number required.' });
	}
	roomNumber = roomNumber.trim();
	try {
		// Case-insensitive, trimmed match
		const room = await Room.findOne({ roomNumber: { $regex: `^${roomNumber}$`, $options: 'i' } });
		console.log('Room found:', room);
		if (room) {
			return res.json({ valid: true });
		} else {
			return res.json({ valid: false, error: 'Room not found.' });
		}
	} catch (err) {
		return res.status(500).json({ valid: false, error: err.message });
	}
});

module.exports = router;
