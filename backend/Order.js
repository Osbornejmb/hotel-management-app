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
    enum: ['pending', 'acknowledged', 'preparing', 'on the way', 'delivered'],
    default: 'pending'
  }
});

// Cancelled Order Schema
const cancelledOrderSchema = new mongoose.Schema({
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
  originalOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  cancelledAt: {
    type: Date,
    default: Date.now
  },
  cancellationReason: {
    type: String,
    required: true
  },
  statusAtCancellation: {
    type: String,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  }
});

const Order = mongoose.model('Order', orderSchema);
const CancelledOrder = mongoose.model('CancelledOrder', cancelledOrderSchema);

module.exports = { Order, CancelledOrder };