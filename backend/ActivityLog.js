const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  actionType: { type: String, required: true }, // e.g., 'create', 'update', 'delete'
  collection: { type: String, required: true }, // 'rooms' or 'bookings'
  documentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  user: { type: String }, // Optionally store user info
  timestamp: { type: Date, default: Date.now },
  details: { type: Object }, // Store what changed
  change: { type: Object }, // Store field changes (old/new)
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
