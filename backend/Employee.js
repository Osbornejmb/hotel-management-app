const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, enum: ['housekeeping', 'maintenance'], required: true },
  // Add other fields as needed
});

module.exports = mongoose.model('Employee', EmployeeSchema);
