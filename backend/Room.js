// backend/Room.js
// Mongoose Room model for a MERN app

const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
		roomNumber: {
			type: String,
			required: true,
			unique: true
		},
		roomType: {
			type: String,
			enum: ['Standard', 'Deluxe'],
			required: true
		},
		description: {
			type: String,
			required: false
		},
		price: {
			type: Number,
			required: false
		},
		amenities: {
			type: [String],
			required: false
		},
		status: {
			type: String,
			enum: ['available', 'booked'],
			default: 'available',
			required: true
		},
		createdAt: {
			type: Date,
			default: Date.now
		}
});

module.exports = mongoose.model('Room', roomSchema);

module.exports = mongoose.model('Room', roomSchema);
