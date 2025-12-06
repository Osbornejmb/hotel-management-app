const express = require('express');
const router = express.Router();
const Room = require('./Room');
const Customer = require('./Customer');
const ActivityLog = require('./ActivityLog');
const { logRoomStatusChange } = require('./activityLogUtils');
console.log('roomRoutes loaded');

// Book a room: update status to 'booked' and save guest info

router.put('/:id/book', async (req, res) => {
	try {
		let { guestName, guestContact, checkoutDate } = req.body;
		if (checkoutDate && checkoutDate.length === 10) {
			checkoutDate = checkoutDate + 'T12:00:00';
		}
		const room = await Room.findById(req.params.id);
		if (!room) {
			return res.status(404).json({ error: 'Room not found' });
		}
		const oldStatus = room.status;
		room.status = 'booked';
		room.guestName = guestName;
		room.guestContact = guestContact;
		await room.save();

		// Save customer info in Customers collection
		const checkinDate = new Date();
		const checkinTime = checkinDate.toLocaleTimeString();
		const customer = new Customer({
			name: guestName,
			contactNumber: guestContact,
			roomNumber: room.roomNumber,
			checkinDate,
			checkinTime,
			checkoutDate,
			status: 'checked in'
		});
		try {
			await customer.save();
		} catch (err) {
			console.error('Error saving customer:', err);
		}

		// Log activity (status change + booking details)
		try {
			await logRoomStatusChange({ roomId: room._id, roomNumber: room.roomNumber, oldValue: oldStatus, newValue: room.status, actionType: 'book' });
			// also store booking details as a separate create so details are preserved
			await ActivityLog.create({
				actionType: 'book_details',
				collection: 'rooms',
				documentId: room._id,
				details: { guestName, guestContact, checkoutDate, roomNumber: room.roomNumber },
			});
		} catch (logErr) {
			console.error('[ActivityLog] Failed to log booking:', logErr);
		}

		res.json({ message: 'Room booked successfully', room, customer });
	} catch (err) {
		console.error('Booking error:', err);
		res.status(400).json({ error: err.message || 'Booking failed' });
	}
});


// Update room status (book room)


router.patch('/:id', async (req, res) => {
	try {
		const { status } = req.body;
		const oldRoom = await Room.findById(req.params.id);
		const room = await Room.findByIdAndUpdate(
			req.params.id,
			{ status },
			{ new: true }
		);
		if (!room) {
			return res.status(404).json({ error: 'Room not found' });
		}
			// Log activity with 'change' field
			try {
				await logRoomStatusChange({ roomId: room._id, roomNumber: room.roomNumber, oldValue: oldRoom ? oldRoom.status : undefined, newValue: status, actionType: 'update' });
				console.log('[ActivityLog] Successfully logged room update.');
			} catch (logErr) {
				console.error('[ActivityLog] Failed to log room update:', logErr);
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
		const { roomNumber, roomType, status, description, price, facilities } = req.body;
		if (!roomNumber || !roomType || !status) {
			return res.status(400).json({ error: 'All fields (roomNumber, roomType, status) are required.' });
		}
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
			facilities: Array.isArray(facilities) ? facilities : (facilities ? facilities.split(',').map(a => a.trim()) : [])
		});
		await newRoom.save();
		// Log activity
		await ActivityLog.create({
			actionType: 'create',
			collection: 'rooms',
			documentId: newRoom._id,
			details: { roomNumber, roomType, status },
		});
		res.status(201).json({ message: 'Room added successfully' });
	} catch (err) {
		if (err.name === 'ValidationError') {
			const messages = Object.values(err.errors).map(e => e.message);
			return res.status(400).json({ error: messages.join(' ') });
		}
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
