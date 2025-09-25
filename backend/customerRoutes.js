const express = require('express');
const router = express.Router();
const Customer = require('./Customer');

// Get all customers (for booking history)
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find({});
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Extend customer check-out date/time
router.put('/extend', async (req, res) => {
  const { roomNumber, newCheckout } = req.body;
  if (!roomNumber || !newCheckout) {
    return res.status(400).json({ error: 'roomNumber and newCheckout are required.' });
  }
  try {
    // Find the most recent customer for this room
    const customer = await Customer.findOne({ roomNumber }).sort({ checkinDate: -1 });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found for this room.' });
    }
    customer.updatedCheckoutDate = newCheckout;
    console.log('Updating customer:', customer._id, 'with updatedCheckoutDate:', newCheckout);
    await customer.save();
    console.log('Customer after save:', customer);
    res.json({ message: 'Check-out updated', customer });
  } catch (err) {
    console.error('Error updating checkout date:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
