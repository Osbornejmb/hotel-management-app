const mongoose = require('mongoose');


const requestSchema = new mongoose.Schema({
	taskId: { type: String, unique: true, required: true },
	roomNumber: { type: String, required: true },
	jobType: { type: String, required: true }, // 'cleaning' or 'maintenance'
	date: { type: Date, default: Date.now },
	priority: { type: String, required: true },
});

module.exports = mongoose.model('Request', requestSchema);
