const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  // TASK ID - Unique identifier for each request/task
  taskId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return `TSK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  },
  
  // ASSIGNED TO - Employee assigned to handle the request
  assignedTo: {
    type: String,
    default: 'Unassigned'
  },
  
  // ROOM - Room number or identifier
  room: {
    type: String,
    required: true,
    index: true
  },
  
  // TASK TYPE - Type of task (replaces jobType)
  taskType: {
    type: String,
    required: true,
    enum: ['cleaning', 'maintenance', 'inspection', 'repair', 'setup', 'other'],
    default: 'cleaning'
  },
  
  // LOCATION - Specific location details within the facility
  location: {
    type: String,
    required: true,
    default: 'Not specified'
  },
  
  // STATUS - Current status of the request
  status: {
    type: String,
    required: true,
    enum: ['pending', 'in-progress', 'completed', 'cancelled', 'on-hold'],
    default: 'pending'
  },
  
  // PRIORITY - Priority level of the request
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Original date field preserved
  date: {
    type: Date,
    default: Date.now
  },
  
  // Additional helpful fields
  description: {
    type: String,
    default: ''
  },
  
  completedAt: {
    type: Date
  },
  
  notes: {
    type: String,
    default: ''
  },
  
  priorStatus: {
    type: String,
    required: false,
    description: 'Room status before request started - used to restore room to correct status when request completes'
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Create indexes for better query performance
requestSchema.index({ status: 1, priority: -1 });
requestSchema.index({ assignedTo: 1, status: 1 });
requestSchema.index({ room: 1, taskType: 1 });
requestSchema.index({ date: -1 });

// Pre-save hook to auto-generate taskId if not provided
requestSchema.pre('save', function(next) {
  if (!this.taskId) {
    this.taskId = `TSK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

module.exports = mongoose.model('Request', requestSchema);