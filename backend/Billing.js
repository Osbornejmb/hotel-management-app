const mongoose = require('mongoose');

const billingItemSchema = new mongoose.Schema({
  name: String,
  img: String,
  category: String,
  price: Number,
  quantity: { type: Number, default: 1, min: 1 },
  addedAt: Date
});

const billingSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  roomNumber: { type: String, required: true },
  items: [billingItemSchema],
  checkedOutAt: Date,
  deliveredAt: { type: Date, default: Date.now },
  totalPrice: { type: Number, required: true }
});

const Billing = mongoose.model('Billing', billingSchema);

module.exports = Billing;
