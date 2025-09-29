// backend/Order.js
// Mongoose model for checked-out carts/orders

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true
  },
  items: [
    {
      name: String,
      img: String,
      category: String,
      price: Number,
      quantity: { 
        type: Number, 
        default: 1,
        min: 1
      },
      addedAt: Date
    }
  ],
  checkedOutAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'delivered'],
    default: 'pending'
  }
});

module.exports = mongoose.model('Order', orderSchema);