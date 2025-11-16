const mongoose = require('mongoose');

const HotelAdNotifSchema = new mongoose.Schema({
  bookingId: { type: String, index: true, sparse: true },
  taskId: { type: String, index: true, sparse: true },
  roomNumber: String,
  roomType: String,
  employeeId: String,
  taskType: String,
  oldStatus: String,
  newStatus: String,
  isRoomNotification: Boolean,
  isTaskNotification: Boolean,
  raw: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
}, { collection: 'hoteladnotifs' });

module.exports = mongoose.model('HotelAdNotif', HotelAdNotifSchema);
