const express = require('express');
const router = express.Router();
const Booking = require('./Booking');
const ActivityLog = require('./ActivityLog');

// Get all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});


// Create a new booking
router.post('/', async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();
    // Log activity
    await ActivityLog.create({
      actionType: 'create',
      collection: 'bookings',
      documentId: booking._id,
      details: req.body,
    });
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Booking creation failed' });
  }
});

// Update a booking
router.patch('/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    // Log activity
    await ActivityLog.create({
      actionType: 'update',
      collection: 'bookings',
      documentId: booking._id,
      details: req.body,
    });
    res.json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Booking update failed' });
  }
});

// Delete a booking
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    // Log activity
    await ActivityLog.create({
      actionType: 'delete',
      collection: 'bookings',
      documentId: booking._id,
      details: booking,
    });
    res.json({ message: 'Booking deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Booking deletion failed' });
  }
});

module.exports = router;
