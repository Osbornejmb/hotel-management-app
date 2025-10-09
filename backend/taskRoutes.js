const express = require('express');
const router = express.Router();
const Task = require('./task');
const Employee = require('./Employee');  // <-- use Employee instead of User

// Helper: Generate next task ID
async function getNextTaskId() {
  const latestTask = await Task.findOne().sort({ taskId: -1 });
  if (!latestTask) return 'T1001';
  
  const lastId = latestTask.taskId;
  const lastNumber = parseInt(lastId.substring(1));
  return `T${lastNumber + 1}`;
}

// Create a new task
router.post('/', async (req, res) => {
  try {
    const { assignedTo, room, type, priority, description } = req.body;

    console.log('Creating task with data:', req.body);

    if (!assignedTo || !room || !type || !priority) {
      return res.status(400).json({ error: 'Missing required fields: assignedTo, room, type, priority' });
    }

    // Find the assigned employee by name
    const employee = await Employee.findOne({
      name: assignedTo,
      role: 'employee'
    });

    console.log('Found employee:', employee);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Generate task ID
    const taskId = await getNextTaskId();
    console.log('Generated task ID:', taskId);

    // Create task
    const task = new Task({
      taskId,
      assignedTo: employee._id,  // ObjectId reference to Employee
      employeeId: employee.employeeId
        ? String(employee.employeeId).padStart(4, '0')
        : 'N/A',
      room,
      type: type.toUpperCase(),
      status: 'NOT_STARTED',
      priority: priority.toUpperCase(),
      description: description || '',
      jobTitle: employee.jobTitle || 'Staff'
    });

    await task.save();
    console.log('Task saved successfully');

    res.status(201).json({
      message: 'Task created successfully',
      task: {
        id: task.taskId,
        assigned: employee.name,
        employeeId: task.employeeId,
        room: task.room,
        type: task.type,
        status: task.status,
        priority: task.priority,
        description: task.description,
        jobTitle: employee.jobTitle || 'Staff',
        createdAt: task.createdAt
      }
    });
  } catch (error) {
    console.error('Create task error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(' ') });
    }
    
    res.status(500).json({ error: error.message || 'Failed to create task' });
  }
});

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignedTo', 'name employeeId jobTitle')
      .sort({ createdAt: -1 });

    const formattedTasks = tasks.map(task => ({
      id: task.taskId,
      assigned: task.assignedTo?.name || 'Unknown',
      employeeId: task.employeeId,
      room: task.room,
      type: task.type,
      status: task.status,
      priority: task.priority,
      description: task.description,
      jobTitle: task.assignedTo?.jobTitle || 'Staff',
      createdAt: task.createdAt,
      dueDate: task.dueDate
    }));

    res.json(formattedTasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch tasks' });
  }
});

module.exports = router;
