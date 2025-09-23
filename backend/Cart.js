// backend/Cart.js
// Mongoose Cart model for storing food orders per room

const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: [
    {
  name: String,
  img: String,
  category: String,
  price: Number,
  addedAt: { type: Date, default: Date.now }
    }
  ],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Cart', cartSchema);
