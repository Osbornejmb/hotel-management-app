const express = require('express');
const router = express.Router();
const Cart = require('./Cart');
const { Order, CancelledOrder } = require('./Order');

// Cancel order and move to cancelled collection
router.post('/orders/cancel', async (req, res) => {
  try {
    const { orderId, reason, originalOrder } = req.body;
    
    if (!orderId || !reason) {
      return res.status(400).json({ error: 'Order ID and cancellation reason are required' });
    }

    // Find the original order to verify it exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Calculate total price
    const totalPrice = order.items.reduce((sum, item) => 
      sum + ((item.price || 0) * (item.quantity || 1)), 0
    );

    // Create cancelled order document
    const cancelledOrder = new CancelledOrder({
      roomNumber: order.roomNumber,
      items: order.items,
      checkedOutAt: order.checkedOutAt,
      originalOrderId: orderId,
      cancellationReason: reason,
      statusAtCancellation: order.status,
      totalPrice: totalPrice
    });

    // Save to cancelled collection
    await cancelledOrder.save();

    // Delete the original order
    await Order.findByIdAndDelete(orderId);

    res.json({ 
      success: true, 
      message: 'Order cancelled successfully', 
      cancelledOrder: cancelledOrder 
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Delete/cancel an order by ID (keep for backward compatibility, but now it just deletes without tracking)
router.delete('/orders/:orderId', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all cancelled orders (for admin if needed)
router.get('/orders/cancelled', async (req, res) => {
  try {
    const cancelledOrders = await CancelledOrder.find({}).sort({ cancelledAt: -1 });
    res.json(cancelledOrders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a cancelled order by ID
router.delete('/orders/cancelled/:cancelledOrderId', async (req, res) => {
  try {
    const result = await CancelledOrder.findByIdAndDelete(req.params.cancelledOrderId);
    if (!result) return res.status(404).json({ error: 'Cancelled order not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Checkout cart for a room (move to orders and clear cart)
router.post('/:roomNumber/checkout', async (req, res) => {
  try {
    const roomNumber = req.params.roomNumber;
    const cart = await Cart.findOne({ roomNumber });
    if (!cart || !cart.items.length) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    // Create new order with status 'pending'
    const order = new Order({ roomNumber, items: cart.items, status: 'pending' });
    await order.save();
    // Clear cart
    cart.items = [];
    await cart.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all checked-out orders (for admin)
router.get('/orders/all', async (req, res) => {
  try {
    const orders = await Order.find({});
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update order status (pending -> delivered)
router.post('/orders/:orderId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    order.status = status;
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    
    // Ensure all items have quantity (default to 1 if not provided)
    const itemsWithQuantity = items.map(item => ({
      ...item,
      quantity: item.quantity || 1
    }));
    
    const cart = await Cart.findOneAndUpdate(
      { roomNumber: req.params.roomNumber },
      { items: itemsWithQuantity, updatedAt: Date.now() },
      { new: true, upsert: true }
    );
    res.json(cart);
  } catch (err) {
    console.error('Cart POST error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update item quantity in cart
router.patch('/:roomNumber/:itemIdx/quantity', async (req, res) => {
  try {
    const roomNumber = req.params.roomNumber;
    const itemIdx = parseInt(req.params.itemIdx);
    const { quantity } = req.body;
    
    if (typeof quantity !== 'number' || quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be a number greater than 0' });
    }
    
    let cart = await Cart.findOne({ roomNumber });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    
    if (isNaN(itemIdx) || itemIdx < 0 || itemIdx >= cart.items.length) {
      return res.status(400).json({ error: 'Invalid item index' });
    }
    
    cart.items[itemIdx].quantity = quantity;
    cart.updatedAt = Date.now();
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add item to cart or update quantity if exists
router.post('/:roomNumber/items', async (req, res) => {
  try {
    const roomNumber = req.params.roomNumber;
    const newItem = { ...req.body, quantity: req.body.quantity || 1 };
    
    let cart = await Cart.findOne({ roomNumber });
    if (!cart) {
      // Create new cart if doesn't exist
      cart = new Cart({ roomNumber, items: [newItem] });
    } else {
      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(
        item => item.name === newItem.name && item.price === newItem.price
      );
      
      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        cart.items[existingItemIndex].quantity += newItem.quantity;
      } else {
        // Add new item if doesn't exist
        cart.items.push(newItem);
      }
      cart.updatedAt = Date.now();
    }
    
    await cart.save();
    res.json(cart);
  } catch (err) {
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