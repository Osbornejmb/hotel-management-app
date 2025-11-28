const express = require('express');
const router = express.Router();
const Notification = require('./notification');

// Get notifications for current user (temporary - without auth)
router.get('/', async (req, res) => {
  try {
    console.log('Fetching notifications...');
    
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`Found ${notifications.length} notifications`);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Get unread notifications - ADD THIS ROUTE
router.get('/unread', async (req, res) => {
  try {
    console.log('Fetching unread notifications...');
    
    const notifications = await Notification.find({ isRead: false })
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`Found ${notifications.length} unread notifications`);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({ message: 'Error fetching unread notifications' });
  }
});

// Mark notification as read (temporary - without auth)
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
});

// Mark all notifications as read (temporary - without auth)
router.patch('/mark-all-read', async (req, res) => {
  try {
    await Notification.updateMany(
      { isRead: false },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error updating notifications' });
  }
});

// Get unread notification count (temporary - without auth)
router.get('/unread-count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      isRead: false
    });

    res.json({ count });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    res.status(500).json({ message: 'Error counting notifications' });
  }
});

module.exports = router;