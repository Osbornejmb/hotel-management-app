// backend/Customer.js
// Mongoose Customer model for hotel bookings

const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['checked in', 'checked out'],
    default: 'checked in',
    required: false
  },
  updatedCheckoutDate: {
    type: String,
    required: false
  },
  checkoutDate: {
    type: String,
    required: false
  },
  name: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  roomNumber: {
    type: String,
    required: true
  },
  checkinDate: {
    type: Date,
    default: Date.now
  },
  checkinTime: {
    type: String,
    required: false
  }
});

module.exports = mongoose.model('Customer', customerSchema);
