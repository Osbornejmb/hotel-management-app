const express = require('express');
const router = express.Router();
const ContactMessage = require('./ContactMessage');

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { name, roomNumber, message } = req.body;
    if (!name || !roomNumber || !message) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const contactMessage = new ContactMessage({ name, roomNumber, message });
    await contactMessage.save();
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save message.' });
  }
});

module.exports = router;
