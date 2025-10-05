const express = require('express');
const router = express.Router();
const Food = require('./Food');

// GET all food items, grouped by category
router.get('/', async (req, res) => {
  try {
    const foods = await Food.find();
    const grouped = {
      breakfast: [], lunch: [], dinner: [], desserts: [], snack: [], beverages: []
    };
    foods.forEach(food => {
      if (grouped[food.category]) grouped[food.category].push(food);
    });
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch food items.' });
  }
});

// POST add a new food item
router.post('/', async (req, res) => {
  const { name, price, category, img, details, available } = req.body;
  if (!name || !price || !category || !img) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  try {
    const food = new Food({ name, price: parseFloat(price), category, img, details, available: available !== undefined ? available : true });
    await food.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add food item.' });
  }
});

// PUT update a food item by ID and category
router.put('/:category/:id', async (req, res) => {
  const { name, price, category, img, details, available } = req.body;
  if (!name || !price || !category || !img) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  try {
    const updateFields = { name, price: parseFloat(price), category, img, details };
    if (available !== undefined) updateFields.available = available;
    const food = await Food.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );
    if (!food) return res.status(404).json({ error: 'Food item not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update food item.' });
  }
// PATCH availability of a food item
router.patch('/:category/:id/availability', async (req, res) => {
  const { available } = req.body;
  if (typeof available !== 'boolean') {
    return res.status(400).json({ error: 'Missing or invalid "available" field.' });
  }
  try {
    const food = await Food.findByIdAndUpdate(
      req.params.id,
      { available },
      { new: true }
    );
    if (!food) return res.status(404).json({ error: 'Food item not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update availability.' });
  }
});
});


// DELETE a food item by category and id
router.delete('/:category/:id', async (req, res) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);
    if (!food) return res.status(404).json({ error: 'Food item not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete food item.' });
  }
});

module.exports = router;
