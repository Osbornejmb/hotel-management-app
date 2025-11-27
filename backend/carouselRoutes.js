const express = require('express');
const router = express.Router();
const CarouselCombo = require('./Carousel');

// Get all active carousel combos
router.get('/combos', async (req, res) => {
  try {
    const combos = await CarouselCombo.find({ active: true }).sort({ createdAt: -1 });
    res.status(200).json(combos);
  } catch (err) {
    console.error('Error fetching carousel combos:', err);
    res.status(500).json({ message: 'Failed to fetch combos', error: err.message });
  }
});

// Get single combo by ID
router.get('/combos/:id', async (req, res) => {
  try {
    const combo = await CarouselCombo.findById(req.params.id);
    if (!combo) {
      return res.status(404).json({ message: 'Combo not found' });
    }
    res.status(200).json(combo);
  } catch (err) {
    console.error('Error fetching combo:', err);
    res.status(500).json({ message: 'Failed to fetch combo', error: err.message });
  }
});

// Create new carousel combo
router.post('/combos', async (req, res) => {
  try {
    const { title, description, price, img, items } = req.body;

    if (!title || !price || !img || !items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Missing required fields: title, price, img, items' });
    }

    // Validate that combo has at least one of each category
    const categories = new Set(items.map(it => it.category));
    if (!categories.has('meal') || !categories.has('snack') || !categories.has('beverage') || !categories.has('dessert')) {
      return res.status(400).json({ message: 'Combo must include at least one meal, snack, beverage, and dessert' });
    }

    const newCombo = new CarouselCombo({
      title,
      description,
      price,
      img,
      items,
      active: true
    });

    const saved = await newCombo.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error creating combo:', err);
    res.status(500).json({ message: 'Failed to create combo', error: err.message });
  }
});

// Update carousel combo
router.put('/combos/:id', async (req, res) => {
  try {
    const { title, description, price, img, items, active } = req.body;

    // Validate that combo has at least one of each category if updating items
    if (items && Array.isArray(items)) {
      const categories = new Set(items.map(it => it.category));
      if (!categories.has('meal') || !categories.has('snack') || !categories.has('beverage') || !categories.has('dessert')) {
        return res.status(400).json({ message: 'Combo must include at least one meal, snack, beverage, and dessert' });
      }
    }

    const updateData = {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(price && { price }),
      ...(img && { img }),
      ...(items && { items }),
      ...(active !== undefined && { active }),
      updatedAt: Date.now()
    };

    const updated = await CarouselCombo.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!updated) {
      return res.status(404).json({ message: 'Combo not found' });
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error('Error updating combo:', err);
    res.status(500).json({ message: 'Failed to update combo', error: err.message });
  }
});

// Delete carousel combo (soft delete via active flag)
router.delete('/combos/:id', async (req, res) => {
  try {
    const deleted = await CarouselCombo.findByIdAndUpdate(
      req.params.id,
      { active: false, updatedAt: Date.now() },
      { new: true }
    );

    if (!deleted) {
      return res.status(404).json({ message: 'Combo not found' });
    }

    res.status(200).json({ message: 'Combo deleted successfully', combo: deleted });
  } catch (err) {
    console.error('Error deleting combo:', err);
    res.status(500).json({ message: 'Failed to delete combo', error: err.message });
  }
});

module.exports = router;
