
// backend/userRoutes.js
// Express routes for User operations

const express = require('express');
const router = express.Router();
const User = require('./User');
const jwt = require('jsonwebtoken');
// Login route - returns JWT and user role
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Create JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '1d' }
    );
    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields (username, email, password, role) are required.' });
    }
    const user = new User({ username, email, password, role });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    // Duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({ error: `A user with that ${field} already exists.` });
    }
    // Validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(' ') });
    }
    // Log error for debugging
    console.error('Registration error:', err);
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

// Get all users (for testing/demo purposes)
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify password for any hotelAdmin user
router.post('/verify-hoteladmin-password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password required.' });
    }
    // Find any hotelAdmin user
    const admins = await User.find({ role: 'hotelAdmin' });
    for (const admin of admins) {
      const isMatch = await admin.comparePassword(password);
      if (isMatch) {
        return res.json({ valid: true });
      }
    }
    return res.status(401).json({ valid: false, error: 'Invalid password.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
