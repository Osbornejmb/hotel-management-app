const express = require('express');
const router = express.Router();

const Task = require('./Task');

// GET /api/tasks/maintenance - fetch only maintenance tasks
router.get('/maintenance', async (req, res) => {
  try {
    const tasks = await Task.find({ type: 'MAINTENANCE' });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch maintenance tasks' });
  }
});

// GET /api/tasks - fetch all tasks (for dashboard and other uses)
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

module.exports = router;
