const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
	roomNumber: String,
	roomType: String,
	status: String
});

module.exports = mongoose.model('Room', roomSchema);
