const express = require('express');
const router = express.Router();
const Request = require('./Request');

// Create a new request
router.post('/', async (req, res) => {
	try {
		const { roomName, jobType, date } = req.body;
		const request = new Request({ roomName, jobType, date });
		await request.save();
		res.status(201).json(request);
	} catch (err) {
		res.status(500).json({ error: 'Failed to create request' });
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
