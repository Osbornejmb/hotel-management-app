const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  employeeCode: { type: String, required: true },
  role: { type: String, required: false },
  department: { type: String, required: true },
  jobTitle: { type: String, required: false },
});

module.exports = mongoose.model('employee', EmployeeSchema);
