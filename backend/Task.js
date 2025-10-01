const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskId: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  employeeId: { type: String },
  room: { type: String },
  type: { type: String },
  status: { type: String },
  priority: { type: String },
  description: { type: String },
  jobTitle: { type: String },
  estimatedDuration: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  dueDate: { type: Date },
  notes: { type: Array, default: [] }
});

module.exports = mongoose.model('Task', taskSchema);
