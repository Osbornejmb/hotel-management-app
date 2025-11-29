const express = require('express');
const router = express.Router();
const Request = require('./Request');
const Employee = require('./Employee');

// Notification helper function - UPDATED with better error handling
const sendRequestNotification = async (request, action, io) => {
  try {
    const Notification = require('./notification'); 
    
    // Check if assignedTo exists before creating notification
    if (request.assignedTo && Employee) {
      try {
        const employeeExists = await Employee.findById(request.assignedTo);
        if (!employeeExists) {
          console.warn(`Employee with ID ${request.assignedTo} not found, skipping notification`);
          return; // Exit early if employee doesn't exist
        }
      } catch (employeeError) {
        console.warn('Error checking employee existence, skipping notification:', employeeError.message);
        return;
      }
    }

    // Determine notification title and message based on action
    let title, message;
    switch (action) {
      case 'created':
        title = 'New Request Created';
        message = `New ${request.taskType} request for room ${request.room}`;
        break;
      case 'updated':
        title = 'Request Updated';
        message = `Request for room ${request.room} has been updated`;
        break;
      case 'assigned':
        title = 'Request Assigned';
        message = `You have been assigned to a ${request.taskType} request`;
        break;
      case 'status_changed':
        title = 'Request Status Updated';
        message = `Request for room ${request.room} is now ${request.status}`;
        break;
      default:
        title = 'Request Notification';
        message = `Update for request ${request.room}`;
    }

    // Create notification for assigned employee if exists
    if (request.assignedTo) {
      try {
        const notification = new Notification({
          userId: request.assignedTo,
          userModel: 'Employee',
          type: 'task_request',
          title: title,
          message: message,
          relatedId: request._id,
          relatedModel: 'Request',
          priority: (request.priority || 'medium').toLowerCase()
        });

        await notification.save();

        // Send real-time notification via socket.io
        if (io) {
          io.to(request.assignedTo.toString()).emit('new-notification', notification);
        }
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Continue without notification
      }
    }

    // Also notify admins or other relevant users about new requests
    if (action === 'created') {
      // You can add logic here to notify admin users
    }

  } catch (error) {
    console.error('Error in sendRequestNotification:', error);
    // Don't throw the error to prevent breaking the main request flow
  }
};

// Create a new request - UPDATED with safe validation
router.post('/', async (req, res) => {
  try {
<<<<<<< HEAD
    const { roomName, roomNumber, jobType, date, priority } = req.body;
    console.log('REQUEST PAYLOAD:', req.body);
    const finalRoomNumber = roomNumber || roomName;
    // Generate a unique taskId (e.g., T + timestamp + random)
    const taskId = 'T' + Date.now() + Math.floor(Math.random() * 1000);
    const request = new Request({
      taskId,
      roomNumber: finalRoomNumber,
      jobType,
      date,
      priority
    });
    await request.save();
    res.status(201).json(request);
  } catch (err) {
    console.error('REQUEST ERROR:', err);
=======
    const { 
      room, 
      taskType, 
      location, 
      assignedTo, 
      status, 
      priority, 
      description,
      notes,
      date 
    } = req.body;

    // Validate assignedTo if provided and Employee model is available
    if (assignedTo && Employee) {
      try {
        const employeeExists = await Employee.findById(assignedTo);
        if (!employeeExists) {
          return res.status(400).json({ error: 'Assigned employee not found' });
        }
      } catch (employeeError) {
        console.warn('Error validating employee, continuing without validation:', employeeError.message);
        // Continue without validation if there's an error
      }
    }

    const request = new Request({ 
      room, 
      taskType, 
      location,
      assignedTo,
      status,
      priority,
      description,
      notes,
      date
    });

    await request.save();
    
    // Send notification after successful creation (with error handling)
    try {
      const io = req.app.get('io');
      if (io) {
        await sendRequestNotification(request, 'created', io);
      }
    } catch (notificationError) {
      console.error('Notification failed but request was created:', notificationError);
      // Continue with response even if notification fails
    }
    
    res.status(201).json(request);
  } catch (err) {
    console.error('Error creating request:', err);
>>>>>>> origin/MALONG
    res.status(500).json({ error: 'Failed to create request', details: err.message });
  }
});

// Get all requests with optional filtering and sorting
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      taskType, 
      assignedTo, 
      room,
      sortBy = 'date',
      order = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (taskType) filter.taskType = taskType;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (room) filter.room = room;

    // Build sort object
    const sortOrder = order === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const requests = await Request.find(filter)
      .populate('assignedTo', 'name employeeId jobTitle')
      .sort(sort);
    
    res.json(requests);
  } catch (err) {
    console.error('Error fetching requests:', err);
    res.status(500).json({ error: 'Failed to fetch requests', details: err.message });
  }
});

// Get a single request by ID
router.get('/:id', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('assignedTo', 'name employeeId jobTitle');
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json(request);
  } catch (err) {
    console.error('Error fetching request:', err);
    res.status(500).json({ error: 'Failed to fetch request', details: err.message });
  }
});

// Update a request - UPDATED with safe validation
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;

    // Validate assignedTo if being updated and Employee model is available
    if (updates.assignedTo && Employee) {
      try {
        const employeeExists = await Employee.findById(updates.assignedTo);
        if (!employeeExists) {
          return res.status(400).json({ error: 'Assigned employee not found' });
        }
      } catch (employeeError) {
        console.warn('Error validating employee, continuing without validation:', employeeError.message);
        // Continue without validation if there's an error
      }
    }

    // If status is being changed to 'completed', set completedAt
    if (updates.status === 'completed' && !updates.completedAt) {
      updates.completedAt = new Date();
    }

    const request = await Request.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name employeeId jobTitle');

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Send notification after successful update (with error handling)
    try {
      const io = req.app.get('io');
      if (io) {
        await sendRequestNotification(request, 'updated', io);
      }
    } catch (notificationError) {
      console.error('Notification failed but update was successful:', notificationError);
      // Continue with response even if notification fails
    }

    res.json(request);
  } catch (err) {
    console.error('Error updating request:', err);
    res.status(500).json({ error: 'Failed to update request', details: err.message });
  }
});

// Assign a request to an employee - UPDATED with safe validation
router.patch('/:id/assign', async (req, res) => {
  try {
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({ error: 'assignedTo field is required' });
    }

    // Validate that employee exists if Employee model is available
    if (Employee) {
      try {
        const employeeExists = await Employee.findById(assignedTo);
        if (!employeeExists) {
          return res.status(400).json({ error: 'Assigned employee not found' });
        }
      } catch (employeeError) {
        console.warn('Error validating employee, continuing without validation:', employeeError.message);
        // Continue without validation if there's an error
      }
    }

    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { 
        assignedTo,
        status: 'in-progress'
      },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name employeeId jobTitle');

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Send notification after assignment (with error handling)
    try {
      const io = req.app.get('io');
      if (io) {
        await sendRequestNotification(request, 'assigned', io);
      }
    } catch (notificationError) {
      console.error('Notification failed but assignment was successful:', notificationError);
      // Continue with response even if notification fails
    }

    res.json(request);
  } catch (err) {
    console.error('Error assigning request:', err);
    res.status(500).json({ error: 'Failed to assign request', details: err.message });
  }
});

// Update request status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status field is required' });
    }

    const updates = { status };
    
    // Auto-set completedAt if status is completed
    if (status === 'completed') {
      updates.completedAt = new Date();
    }

    const request = await Request.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name employeeId jobTitle');

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Send notification after status change (with error handling)
    try {
      const io = req.app.get('io');
      if (io) {
        await sendRequestNotification(request, 'status_changed', io);
      }
    } catch (notificationError) {
      console.error('Notification failed but status update was successful:', notificationError);
      // Continue with response even if notification fails
    }

    res.json(request);
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Failed to update status', details: err.message });
  }
});

// Delete a request
router.delete('/:id', async (req, res) => {
  try {
    const request = await Request.findByIdAndDelete(req.params.id);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ message: 'Request deleted successfully', request });
  } catch (err) {
    console.error('Error deleting request:', err);
    res.status(500).json({ error: 'Failed to delete request', details: err.message });
  }
});

// Get statistics/dashboard data
router.get('/stats/summary', async (req, res) => {
  try {
    const [
      totalRequests,
      pendingRequests,
      inProgressRequests,
      completedRequests,
      highPriorityRequests
    ] = await Promise.all([
      Request.countDocuments(),
      Request.countDocuments({ status: 'pending' }),
      Request.countDocuments({ status: 'in-progress' }),
      Request.countDocuments({ status: 'completed' }),
      Request.countDocuments({ priority: 'high' })
    ]);

    res.json({
      total: totalRequests,
      pending: pendingRequests,
      inProgress: inProgressRequests,
      completed: completedRequests,
      highPriority: highPriorityRequests
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch statistics', details: err.message });
  }
});

// GET /api/requests/employees - get all employees for request assignment
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

module.exports = router;