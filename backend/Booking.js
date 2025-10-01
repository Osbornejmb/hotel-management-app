const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  customerName: String,
  customerEmail: String,
  checkInDate: Date,
  checkOutDate: Date,
  specialId: String,
  partialPayment: Number,
  paymentStatus: String,
  paymentDetails: Object,
  bookingStatus: String,
  totalAmount: Number,
  bookedAt: Date,
});

module.exports = mongoose.model('Booking', bookingSchema);