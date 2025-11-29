const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  cardId: { type: String, required: true, unique: true },
  role: { type: String },
  hiringDate: { type: String },
  payroll: { type: Object }
});

module.exports = mongoose.model('Employee', employeeSchema, 'employees');
