const express = require('express');
const router = express.Router();
const Request = require('./Request');

// Notification helper function - UPDATED
const sendRequestNotification = async (request, action, io) => {
  try {
    const Notification = require('./notification'); 
    
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
      const notification = new Notification({
        userId: request.assignedTo,
        userModel: 'Employee',
        type: 'task_request',
        title: title,
        message: message,
        relatedId: request._id,
        relatedModel: 'Request',
        priority: (request.priority || 'medium').toLowerCase() // FIX: Convert to lowercase
      });

      await notification.save();

      // Send real-time notification via socket.io
      if (io) {
        io.to(request.assignedTo.toString()).emit('new-notification', notification);
      }
    }

    // Also notify admins or other relevant users about new requests
    if (action === 'created') {
      // You can add logic here to notify admin users
      // For example, find all admin users and send them notifications
    }

  } catch (error) {
    console.error('Error sending request notification:', error);
  }
};

// Create a new request
router.post('/', async (req, res) => {
  try {
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
    
    // Send notification after successful creation
    const io = req.app.get('io');
    if (io) {
      await sendRequestNotification(request, 'created', io);
    }
    
    res.status(201).json(request);
  } catch (err) {
    console.error('Error creating request:', err);
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

    const requests = await Request.find(filter).sort(sort);
    res.json(requests);
  } catch (err) {
    console.error('Error fetching requests:', err);
    res.status(500).json({ error: 'Failed to fetch requests', details: err.message });
  }
});

// Get a single request by ID
router.get('/:id', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json(request);
  } catch (err) {
    console.error('Error fetching request:', err);
    res.status(500).json({ error: 'Failed to fetch request', details: err.message });
  }
});

// Update a request
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;

    // If status is being changed to 'completed', set completedAt
    if (updates.status === 'completed' && !updates.completedAt) {
      updates.completedAt = new Date();
    }

    const request = await Request.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Send notification after successful update
    const io = req.app.get('io');
    if (io) {
      await sendRequestNotification(request, 'updated', io);
    }

    res.json(request);
  } catch (err) {
    console.error('Error updating request:', err);
    res.status(500).json({ error: 'Failed to update request', details: err.message });
  }
});

// Assign a request to an employee
router.patch('/:id/assign', async (req, res) => {
  try {
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({ error: 'assignedTo field is required' });
    }

    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { 
        assignedTo,
        status: 'in-progress' // Optionally change status when assigned
      },
      { new: true, runValidators: true }
    );

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Send notification after assignment
    const io = req.app.get('io');
    if (io) {
      await sendRequestNotification(request, 'assigned', io);
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
    );

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Send notification after status change
    const io = req.app.get('io');
    if (io) {
      await sendRequestNotification(request, 'status_changed', io);
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

module.exports = router;