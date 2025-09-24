const express = require('express');
const router = express.Router();
const Room = require('./Room');
const Customer = require('./Customer');

// Checkout route: set room to available and customer status to checkout
router.put('/checkout', async (req, res) => {
  const { roomNumber } = req.body;
  console.log('Checkout request received for roomNumber:', roomNumber);
  if (!roomNumber) {
    console.error('No roomNumber provided in checkout request');
    return res.status(400).json({ error: 'roomNumber is required.' });
  }
  try {
    // Update room status
    const room = await Room.findOneAndUpdate(
      { roomNumber },
      { status: 'available', guestName: '', guestContact: '' },
      { new: true }
    );
    if (!room) {
      console.error('Room not found for checkout:', roomNumber);
      return res.status(404).json({ error: 'Room not found.' });
    }
    // Update most recent customer for this room
    const mostRecentCustomer = await Customer.findOne({ roomNumber }).sort({ checkinDate: -1 });
    let updatedCustomer = null;
    if (mostRecentCustomer) {
      updatedCustomer = await Customer.findByIdAndUpdate(
        mostRecentCustomer._id,
        { $set: { status: 'checked out' } },
        { new: true }
      );
      console.log('Customer status set to checked out:', updatedCustomer);
    } else {
      console.error('Customer not found for checkout:', roomNumber);
    }
    res.json({ message: 'Checked out', room, customer });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
