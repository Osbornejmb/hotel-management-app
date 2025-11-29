const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  cardId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  clockIn: {
    type: Date,
    required: true
  },
  clockOut: {
    type: Date
  },
  totalHours: {
    type: Number
  },
  date: {
    type: String,
    required: true
  }
});

const Attendance = mongoose.model('Attendance', attendanceSchema, 'attendances');

module.exports = Attendance;