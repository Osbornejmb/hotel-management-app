const express = require('express');
const router = express.Router();
const Reservation = require('./Reservation');

// Create a reservation
router.post('/', async (req, res) => {
  const { name, room, date, time, amenity } = req.body;
  if (!name || !room || !date || !time || !amenity) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const reservation = new Reservation({ name, room, date, time, amenity });
    await reservation.save();
    res.status(201).json({ message: 'Reservation created successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all reservations
router.get('/', async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
