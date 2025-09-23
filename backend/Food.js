const mongoose = require('mongoose');

const FoodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  img: { type: String, required: true },
  details: { type: String }
});

module.exports = mongoose.model('Food', FoodSchema);
