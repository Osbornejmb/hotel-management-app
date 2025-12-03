const express = require('express');
const router = express.Router();
const Cart = require('./Cart');
const { Order, CancelledOrder } = require('./Order');
const Billing = require('./Billing');

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
    const prevStatus = order.status;
    order.status = status;
    await order.save();

    // If status changed to delivered, create a billing record
    if (status === 'delivered' && prevStatus !== 'delivered') {
      try {
        // Prevent duplicate billing for the same order
        const existing = await Billing.findOne({ orderId: order._id });
        if (!existing) {
          const totalPrice = order.items.reduce((sum, item) =>
            sum + ((item.price || 0) * (item.quantity || 1)), 0
          );

          const billing = new Billing({
            orderId: order._id,
            roomNumber: order.roomNumber,
            items: order.items,
            checkedOutAt: order.checkedOutAt,
            deliveredAt: Date.now(),
            totalPrice
          });
          await billing.save();
        }
      } catch (billingErr) {
        console.error('Failed to create billing record:', billingErr);
        // do not fail the main request because billing failed, but inform in response
        return res.status(500).json({ error: 'Order updated but failed to create billing record' });
      }
    }

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

// Upsell suggestions endpoint: analyze cart and recommend missing items
router.post('/:roomNumber/upsell', async (req, res) => {
  try {
    const roomNumber = req.params.roomNumber;
    const Food = require('./Food');

    // Debug flag
    const debug = req.query && (req.query.debug === 'true' || req.query.debug === '1');

    // Get the cart
    const cart = await Cart.findOne({ roomNumber });
    // Normalize cart items: some older documents may store items as an object/map instead of an array.
    const cartItems = (function() {
      if (!cart) return [];
      if (Array.isArray(cart.items)) return cart.items;
      if (cart.items && typeof cart.items === 'object') {
        try {
          const vals = Object.values(cart.items).filter(Boolean);
          return Array.isArray(vals) ? vals : [];
        } catch (e) {
          return [];
        }
      }
      return [];
    })();

    if (!cart || !cartItems.length) {
      return res.json({
        showUpsell: false,
        reason: 'empty_cart',
        recommendations: []
      });
    }

    // Analyze cart for food items and presence of snack/beverage/dessert
    // use normalized `cartItems` variable

    // hasFoodItems: any item not in the three upsell categories
    // Use substring matching to be tolerant of categories like "snacks & sides", "beverage - wine", etc.
    const hasFoodItems = cartItems.some(item => {
      const c = (item.category || '').toLowerCase();
      // if category contains any upsell keyword, it's not considered a "main food" here
      const isUpsellCat = c.includes('bever') || c.includes('drink') || c.includes('dessert') || c.includes('snack');
      return !isUpsellCat;
    });

    if (!hasFoodItems) {
      // No main food items, no upsell needed
      return res.json({
        showUpsell: false,
        reason: 'no_food_items',
        recommendations: []
      });
    }

    // Presence checks
    const hasBeverages = cartItems.some(item => {
      const c = (item.category || '').toLowerCase();
      return c.includes('bever') || c.includes('drink');
    });

    const hasDesserts = cartItems.some(item => {
      const c = (item.category || '').toLowerCase();
      return c.includes('dessert');
    });

    const hasSnacks = cartItems.some(item => {
      const c = (item.category || '').toLowerCase();
      return c.includes('snack');
    });

    // If customer already has all three categories, no upsell needed
    if (hasBeverages && hasDesserts && hasSnacks) {
      return res.json({
        showUpsell: false,
        reason: 'has_all_three',
        recommendations: []
      });
    }

    // Fetch available items from database
    const allFoods = await Food.find({ available: true });

    // candidate pools
    const beverageCandidates = allFoods.filter(food => {
      const c = (food.category || '').toLowerCase();
      return c.includes('bever') || c.includes('drink');
    });

    const dessertCandidates = allFoods.filter(food => {
      const c = (food.category || '').toLowerCase();
      return c.includes('dessert');
    });

    const snackCandidates = allFoods.filter(food => {
      const c = (food.category || '').toLowerCase();
      return c.includes('snack');
    });

    // Randomize candidate lists so recommendations are not always the first items
    const shuffleArray = (sourceArr) => {
      const arr = Array.isArray(sourceArr) ? sourceArr.slice() : [];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
      return arr;
    };

    const shuffledBeverageCandidates = shuffleArray(beverageCandidates);
    const shuffledDessertCandidates = shuffleArray(dessertCandidates);
    const shuffledSnackCandidates = shuffleArray(snackCandidates);

    const candidateCounts = {
      beverages: beverageCandidates.length,
      desserts: dessertCandidates.length,
      snacks: snackCandidates.length
    };

    // Build recommendations to include missing categories first. We will ensure the returned recommendations contain at least one item from the missing categories among {snack, beverages, desserts}.
    const recommendations = [];
    let upsellMessage = '';
    let upsellHeading = 'You Might Have Forgotten Something!';

    // Determine missing categories
    const missing = [];
    if (!hasBeverages) missing.push('beverages');
    if (!hasDesserts) missing.push('desserts');
    if (!hasSnacks) missing.push('snacks');

    // If none missing (should be caught earlier), return no upsell
    if (missing.length === 0) {
      return res.json({ showUpsell: false, reason: 'nothing_missing', recommendations: [] });
    }

    // Helper to push candidates into recommendations (avoid duplicates and avoid items already in the cart)
    const pushCandidates = (arr, type, max) => {
      for (let i = 0; i < arr.length && recommendations.length < max; i++) {
        const f = arr[i];
        // avoid duplicates by _id
        if (recommendations.find(r => String(r._id) === String(f._id))) continue;

        // don't recommend an item that's already in the cart. Compare by _id if present, otherwise by name+price
        const alreadyInCart = cartItems.some(ci => {
          try {
            if (ci._id && f._id && String(ci._id) === String(f._id)) return true;
          } catch (e) { /* ignore */ }
          return ci.name === f.name && Number(ci.price) === Number(f.price);
        });
        if (alreadyInCart) continue;

        recommendations.push({ ...f.toObject(), recommendationType: type });
      }
    };

    // Strategy:
    // - If multiple categories missing, try to show at least one from each missing category (up to 3 total)
    // - If only one category missing, show up to 3 items from that category
    // Prioritize beverages first, then snacks, then desserts when multiple are missing.
    const priorityOrder = ['beverages', 'snacks', 'desserts'];
    const maxRecs = 3;

    if (missing.length === 1) {
      const only = missing[0];
      upsellMessage = `Add ${only} to complete your meal!`;
      if (only === 'beverages') pushCandidates(beverageCandidates, 'beverage', maxRecs);
      if (only === 'snacks') pushCandidates(snackCandidates, 'snack', maxRecs);
      if (only === 'desserts') pushCandidates(dessertCandidates, 'dessert', maxRecs);
    } else {
      // multiple missing: ensure at least one from each missing category
      upsellMessage = 'Complete your meal with one of these additions!';
      // First pass: add one from each missing category
      for (const cat of priorityOrder) {
        if (missing.includes(cat) && recommendations.length < maxRecs) {
          if (cat === 'beverages' && shuffledBeverageCandidates.length > 0) pushCandidates([shuffledBeverageCandidates[0]], 'beverage', maxRecs);
          if (cat === 'snacks' && shuffledSnackCandidates.length > 0) pushCandidates([shuffledSnackCandidates[0]], 'snack', maxRecs);
          if (cat === 'desserts' && shuffledDessertCandidates.length > 0) pushCandidates([shuffledDessertCandidates[0]], 'dessert', maxRecs);
        }
      }

      // Second pass: if we still have slots, fill from priority order with more candidates
      if (recommendations.length < maxRecs) {
        for (const cat of priorityOrder) {
          if (recommendations.length >= maxRecs) break;
          if (cat === 'beverages') pushCandidates(shuffledBeverageCandidates, 'beverage', maxRecs);
          if (cat === 'snacks') pushCandidates(shuffledSnackCandidates, 'snack', maxRecs);
          if (cat === 'desserts') pushCandidates(shuffledDessertCandidates, 'dessert', maxRecs);
        }
      }
    }

    // Trim to max 3 recommendations (safety)
    const finalRecs = recommendations.slice(0, maxRecs);

    // Return response (include debug info when requested)
    const baseResponse = {
      showUpsell: finalRecs.length > 0,
      upsellHeading,
      upsellMessage,
      recommendations: finalRecs
    };

    if (debug) {
      return res.json({
        ...baseResponse,
        debug: {
          detected: { hasBeverages, hasDesserts, hasSnacks, hasFoodItems },
          candidateCounts
        }
      });
    }

    return res.json(baseResponse);
  } catch (err) {
    console.error('Upsell error:', err);
    res.status(500).json({ 
      error: err.message,
      showUpsell: false,
      recommendations: []
    });
  }
});

module.exports = router;