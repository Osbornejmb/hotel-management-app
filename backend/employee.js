const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  employeeName: { type: String, required: true },
  role: { type: String },
  hiringDate: { type: String },
  payroll: { type: Object }
});

module.exports = mongoose.model('Employee', employeeSchema);
