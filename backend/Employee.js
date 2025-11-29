const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const EmployeeSchema = new mongoose.Schema({
  // existing fields (preserved)
  name: { type: String, required: true },
  // allow frontend role values like 'employee' and admin roles as needed
  role: {
    type: String,
    enum: ['employee', 'employeeAdmin', 'hotelAdmin', 'restaurantAdmin', 'housekeeping', 'maintenance'],
    required: false,
    default: 'employee'
  },

  department: { type: String, required: true },

  // copied/added from User schema (adapted for employees)
  username: { type: String, required: false, unique: true, sparse: true },
  email: { type: String, required: false, unique: true, sparse: true },
  // numeric employee id for ordering/searching
  employeeId: { type: Number, unique: true, sparse: true, required: false },
  // human/padded code if you prefer a display code
  employeeCode: { type: String, required: false, unique: false },

  // optional password for employee accounts (will be hashed)
  password: { type: String, required: false },

  // job title / classification
  jobTitle: {
    type: String,
    enum: ['Cleaner', 'Clerk', 'Maintenance', 'Manager', 'Staff'],
    default: 'Staff'
  },

  // contact number storage
  contactNumber: { type: String, default: '' },

  // status and timestamps
  status: { type: String, enum: ['active', 'inactive', 'terminated'], default: 'active' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  // free-text notes
  notes: { type: String, default: '' }
});

// Hash password before saving (Employee)
EmployeeSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  if (!this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare password (Employee)
EmployeeSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Avoid OverwriteModelError when models are reloaded (e.g., in dev/hot-reload)
module.exports = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
