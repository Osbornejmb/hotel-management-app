const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
	roomName: { type: String, required: true },
	jobType: { type: String, required: true }, // 'cleaning' or 'maintenance'
	date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Request', requestSchema);
