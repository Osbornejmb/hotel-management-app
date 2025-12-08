const express = require('express');
const router = express.Router();
const Task = require('./task');
const Employee = require('./Employee');
const Room = require('./Room');
const { updateRoomStatusOnTaskChange } = require('./roomStatusUtils');

// Notification helper function - UPDATED
const sendTaskNotification = async (task, action, io) => {
  try {
    const Notification = require('./notification'); 
    
    // Determine notification title and message based on action
    let title, message;
    switch (action) {
      case 'created':
        title = 'New Task Assigned';
        message = `New ${task.type} task for room ${task.room}`;
        break;
      case 'status_updated':
        title = 'Task Status Updated';
        message = `Task ${task.taskId} is now ${task.status}`;
        break;
      case 'deleted':
        title = 'Task Deleted';
        message = `Task ${task.taskId} has been deleted`;
        break;
      default:
        title = 'Task Notification';
        message = `Update for task ${task.taskId}`;
    }

    // Create notification for assigned employee
    if (task.assignedTo) {
      const notification = new Notification({
        userId: task.assignedTo,
        userModel: 'Employee',
        type: 'task_update',
        title: title,
        message: message,
        relatedId: task._id,
        relatedModel: 'Task',
        priority: (task.priority || 'medium').toLowerCase()
      });

      await notification.save();

      // Send real-time notification via socket.io
      if (io) {
        io.to(task.assignedTo.toString()).emit('new-notification', notification);
      }
    }

  } catch (error) {
    console.error('Error sending task notification:', error);
  }
};

// Helper: Generate next task ID
async function getNextTaskId() {
  const latestTask = await Task.findOne().sort({ taskId: -1 });
  if (!latestTask) return 'T1001';
  
  const lastId = latestTask.taskId;
  const lastNumber = parseInt(lastId.substring(1));
  return `T${lastNumber + 1}`;
}

// GET /api/tasks - get all tasks with employee population
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

// GET /api/tasks/employees/list - get all employees for task assignment
// NOTE: This route MUST come before /:taskId route to avoid route collision
router.get('/employees/list', async (req, res) => {
  try {
    const employees = await Employee.find({ role: 'employee' })
      .select('name employeeId jobTitle department')
      .sort({ name: 1 });

    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch employees' });
  }
});

// GET /api/tasks/:taskId - get single task by ID
router.get('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const task = await Task.findOne({ taskId })
      .populate('assignedTo', 'name employeeId jobTitle');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const formattedTask = {
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
    };

    res.json(formattedTask);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch task' });
  }
});

// PATCH /api/tasks/:taskId/status - update task status
router.patch('/:taskId/status', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    console.log('Updating task status:', { taskId, status });

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Match the schema enum values exactly
    const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: NOT_STARTED, IN_PROGRESS, or COMPLETED' });
    }

    // Find task by taskId (not MongoDB _id)
    const task = await Task.findOne({ taskId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // If task is transitioning to IN_PROGRESS, capture the current room status
    if (status === 'IN_PROGRESS' && task.status !== 'IN_PROGRESS') {
      try {
        const roomNumberQuery = (task.room || '').toString().trim();
        const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const room = await Room.findOne({ roomNumber: { $regex: `^${escapeRegExp(roomNumberQuery)}$`, $options: 'i' } });
        
        if (room && !task.priorStatus) {
          task.priorStatus = room.status;
          console.log(`Captured prior room status: ${room.status} for task ${taskId}`);
        }
      } catch (err) {
        console.warn('Could not capture prior room status:', err.message);
        // Continue without prior status - the system will try to infer it
      }
    }

    task.status = status;
    await task.save();

    console.log('Task status updated successfully:', task.taskId, task.status);

    // Update room status based on task status change
    try {
      const roomStatusChange = await updateRoomStatusOnTaskChange(task, status);
      if (roomStatusChange) {
        console.log(`Room status updated: ${roomStatusChange.oldStatus} -> ${roomStatusChange.newStatus}`);
      }
    } catch (roomStatusErr) {
      console.error('Error updating room status on task change:', roomStatusErr);
      // Continue with task update even if room status update fails
    }

    // Send notification after status update
    const io = req.app.get('io');
    if (io) {
      await sendTaskNotification(task, 'status_updated', io);
    }

    // Populate the assignedTo field for the response
    await task.populate('assignedTo', 'name employeeId jobTitle');

    res.json({ 
      message: 'Task status updated successfully',
      task: {
        id: task.taskId,
        assigned: task.assignedTo?.name || 'Unknown',
        employeeId: task.employeeId,
        room: task.room,
        type: task.type,
        status: task.status,
        priority: task.priority,
        description: task.description,
        jobTitle: task.assignedTo?.jobTitle || 'Cleaner'
      }
    });
  } catch (error) {
    console.error('Update task status error:', error);
    
    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    res.status(500).json({ error: error.message || 'Failed to update task status' });
  }
});

// POST /api/tasks - create a new task
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

    // Send notification after task creation
    const io = req.app.get('io');
    if (io) {
      await sendTaskNotification(task, 'created', io);
    }

    // Populate the assignedTo field for the response
    await task.populate('assignedTo', 'name employeeId jobTitle');

    res.status(201).json({
      message: 'Task created successfully',
      task: {
        id: task.taskId,
        assigned: task.assignedTo?.name || 'Unknown',
        employeeId: task.employeeId,
        room: task.room,
        type: task.type,
        status: task.status,
        priority: task.priority,
        description: task.description,
        jobTitle: task.assignedTo?.jobTitle || 'Staff',
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

// DELETE /api/tasks/:taskId - delete a task
router.delete('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const task = await Task.findOneAndDelete({ taskId });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Send notification after task deletion
    const io = req.app.get('io');
    if (io) {
      await sendTaskNotification(task, 'deleted', io);
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete task' });
  }
});

module.exports = router;