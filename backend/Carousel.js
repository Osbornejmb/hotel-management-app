const mongoose = require('mongoose');

const carouselComboSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    img: {
      type: String,
      required: true
    },
    items: [
      {
        name: {
          type: String,
          required: true
        },
        category: {
          type: String,
          enum: ['meal', 'snack', 'beverage', 'dessert'],
          required: true
        },
        qty: {
          type: Number,
          default: 1
        }
      }
    ],
    active: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

const CarouselCombo = mongoose.model('CarouselCombo', carouselComboSchema);
module.exports = CarouselCombo;
