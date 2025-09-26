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
 		enum: ['Standard', 'Deluxe', 'Economy room', 'Deluxe room', 'Suite room'],
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
	facilities: {
		type: [String],
		required: false
	},
	status: {
		type: String,
		enum: ['available', 'booked', 'under maintenance'],
		default: 'available',
		required: true
	},
	guestName: {
		type: String,
		required: false
	},
	guestContact: {
		type: String,
		required: false
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	cart: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Cart',
		required: false
	}
});

module.exports = mongoose.model('Room', roomSchema);

module.exports = mongoose.model('Room', roomSchema);
