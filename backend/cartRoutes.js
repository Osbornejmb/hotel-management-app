// backend/cartRoutes.js
// Express routes for Cart operations

const express = require('express');
const router = express.Router();
const Cart = require('./Cart');

// Get cart for a room
router.get('/:roomNumber', async (req, res) => {
  try {
    const cart = await Cart.findOne({ roomNumber: req.params.roomNumber });
    res.json(cart || { roomNumber: req.params.roomNumber, items: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Replace cart items for a room
router.post('/:roomNumber', async (req, res) => {
  try {
    const { items } = req.body;
    console.log('POST /api/cart:', { roomNumber: req.params.roomNumber, items });
    const cart = await Cart.findOneAndUpdate(
      { roomNumber: req.params.roomNumber },
      { items, updatedAt: Date.now() },
      { new: true, upsert: true }
    );
    res.json(cart);
  } catch (err) {
    console.error('Cart POST error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete an item from the cart by index
router.delete('/:roomNumber/:itemIdx', async (req, res) => {
  try {
    const roomNumber = req.params.roomNumber;
    const itemIdx = parseInt(req.params.itemIdx);
    let cart = await Cart.findOne({ roomNumber });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    if (isNaN(itemIdx) || itemIdx < 0 || itemIdx >= cart.items.length) {
      return res.status(400).json({ error: 'Invalid item index' });
    }
    cart.items.splice(itemIdx, 1);
    cart.updatedAt = Date.now();
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
