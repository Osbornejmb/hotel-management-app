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
const EmployeeSchema = new mongoose.Schema({
  // human-friendly employee id with prefix, e.g. "E002"
  employeeId: { type: String, unique: true, sparse: true },

  // full name to display in UI
  fullName: { type: String, required: true },

  // job classification / title (e.g. Room Attendant, Cleaner)
  position: { type: String, default: 'Staff' },

  // department (e.g. Housekeeping, Front Desk)
  department: { type: String, default: '' },

  // contact phone number recorded as string
  contactNumber: { type: String, default: '' },

  // email for contact / login reference
  email: { type: String, default: '' },

  // current employment status
  status: { type: String, enum: ['active', 'inactive', 'terminated'], default: 'active' },

  // hire date
  dateHired: { type: Date },

  // shift assignment (Morning, Evening, Night, etc.)
  shift: { type: String, default: '' },

  // free-text notes about the employee
  notes: { type: String, default: '' },

  // optional link to a User account (if you keep auth in users collection)
  userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add indexes if desired:
// EmployeeSchema.index({ employeeId: 1 }, { unique: true, sparse: true });

/* 
  NOTE FOR MAINTAINERS:
  - To add more job classes or fields, update the `position` or add a new field here.
  - If you prefer an enum for `position`, replace type: String with enum: [ 'Cleaner','Clerk', ... ]
*/

module.exports = mongoose.model('Employee', EmployeeSchema);