const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    required: true,
    enum: ['User', 'Employee', 'Customer']
  },
  type: {
    type: String,
    required: true,
    enum: ['task_request', 'task_update', 'request_update']
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  relatedModel: {
    type: String,
    required: true,
    enum: ['Task', 'Request']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  // New fields to fix the validation errors
  action: {
    type: String,
    enum: ['created', 'updated', 'assigned', 'status_changed', 'deleted'],
    required: false // Make it optional since it was added later
  },
  taskId: {
    type: String, // For task notifications (T1001, T1002, etc.)
    required: false // Make it optional
  },
  room: {
    type: String, // Room number from tasks/requests
    required: false
  },
  taskType: {
    type: String, // Type of task/request
    required: false
  },
  status: {
    type: String, // Current status of the task/request
    required: false
  }
}, {
  timestamps: true
});

// Index for better query performance
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ relatedId: 1, relatedModel: 1 });

module.exports = mongoose.model('Notification', notificationSchema);