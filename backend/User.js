// backend/User.js
// Mongoose User model for a MERN app

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['restaurantAdmin', 'hotelAdmin', 'employeeAdmin', 'employee'],
    default: 'restaurantAdmin',
    required: true
  },
  employeeId: {
    type: Number,
    unique: true,
    sparse: true,
    required: false
  },
  // jobTitle indicates the specific job/class for an employee (sub-role)
  // Add new job classes here as needed, for example: 'Cleaner', 'Clerk', 'Maintenance', 'Manager'
  jobTitle: {
    type: String,
    enum: ['Cleaner', 'Clerk', 'Maintenance', 'Manager', 'Staff'],
    default: 'Staff'
  },
  // store contact number for employees and users
  contact_number: {
    type: String,
    required: false,
    default: ''
  },
  // store unique card IDs for employees
  cardId: {
    type: String,
    unique: true,
    sparse: true,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
