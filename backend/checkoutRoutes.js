const express = require('express');
const router = express.Router();
const Room = require('./Room');
const Customer = require('./Customer');
const { setRoomCheckedOut } = require('./roomStatusUtils');

// Checkout route: set room to checked-out and customer status to checkout
router.put('/checkout', async (req, res) => {
  const { roomNumber } = req.body;
  console.log('Checkout request received for roomNumber:', roomNumber);
  if (!roomNumber) {
    console.error('No roomNumber provided in checkout request');
    return res.status(400).json({ error: 'roomNumber is required.' });
  }
  try {
    // Update room status to checked-out using utility function
    const roomStatusChange = await setRoomCheckedOut(roomNumber);
    const room = await Room.findOne({ roomNumber });
    
    if (!room) {
      console.error('Room not found for checkout:', roomNumber);
      return res.status(404).json({ error: 'Room not found.' });
    }

    // Clear guest information
    room.guestName = '';
    room.guestContact = '';
    await room.save();

    // Update most recent customer for this room
    const mostRecentCustomer = await Customer.findOne({ roomNumber }).sort({ checkinDate: -1 });
    let updatedCustomer = null;
    if (mostRecentCustomer) {
      // Set status to checked out and updatedCheckoutDate to today
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      updatedCustomer = await Customer.findByIdAndUpdate(
        mostRecentCustomer._id,
        { $set: { status: 'checked out', updatedCheckoutDate: today } },
        { new: true }
      );
      console.log('Customer status set to checked out and updatedCheckoutDate:', updatedCustomer);
    } else {
      console.error('Customer not found for checkout:', roomNumber);
    }
  res.json({ message: 'Checked out - room status set to checked-out', room, customer: updatedCustomer });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
