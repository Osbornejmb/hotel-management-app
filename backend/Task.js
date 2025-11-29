const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  note: { type: String },
  addedAt: { type: Date, default: Date.now },
  addedBy: { type: String }
}, { _id: false });

const taskSchema = new mongoose.Schema({
  taskId: {
    type: String,
    required: true,
    unique: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeId: {
    type: String,
    required: true
  },
  room: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['CLEANING', 'MAINTENANCE', 'INSPECTION'],
    required: true
  },
  status: {
    type: String,
    enum: ['UNASSIGNED', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
    default: 'NOT_STARTED'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  jobTitle: {
    type: String,
    default: 'Staff'
  },
  estimatedDuration: {
    type: Number,
    default: 30
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
  },
  createdBy: {
    type: String,
    default: 'system'
  },
  notes: {
    type: [noteSchema],
    default: []
  }
});

taskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Task', taskSchema);
