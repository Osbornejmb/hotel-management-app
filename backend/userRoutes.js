// backend/userRoutes.js
// Express routes for User operations

const express = require('express');
const router = express.Router();
const User = require('./User');
const jwt = require('jsonwebtoken');

// Helper: find smallest vacant employeeId (number) starting from 1
async function getNextEmployeeIdNumber() {
  // fetch all assigned employeeIds, sort ascending
  const usersWithId = await User.find({ employeeId: { $exists: true } }, { employeeId: 1 }).sort({ employeeId: 1 });
  const ids = usersWithId.map(u => u.employeeId).filter(n => typeof n === 'number').sort((a, b) => a - b);
  // find smallest missing positive integer
  let expect = 1;
  for (let id of ids) {
    if (id > expect) break;
    if (id === expect) expect++;
  }
  return expect;
}
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
    res.json({ token, role: user.role, username: user.username, name: user.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, name, email, password, role, jobTitle, contact_number } = req.body;
    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields (username, email, password, role) are required.' });
    }
    const userObj = { username, name, email, password, role };
    if (contact_number) userObj.contact_number = contact_number;
    // If registering an employee, auto-assign the next available employeeId (number)
    if ((role || '').toLowerCase() === 'employee') {
      const nextId = await getNextEmployeeIdNumber();
      userObj.employeeId = nextId;
      // accept optional jobTitle (sub-role) for employees
      if (jobTitle) userObj.jobTitle = jobTitle;
    }
    const user = new User(userObj);
    await user.save();
    res.status(201).json({ message: 'User registered successfully', employeeId: user.employeeId });
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

// Endpoint to get the next suggested employee ID as zero-padded 4-digit string
router.get('/next-employee-id', async (req, res) => {
  try {
    const next = await getNextEmployeeIdNumber();
    const padded = String(next).padStart(4, '0');
    res.json({ nextId: next, padded });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

// Delete user by id
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
