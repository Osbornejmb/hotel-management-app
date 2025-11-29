const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Employee = require('./Employee'); // use existing Employee.js model
const jwt = require('jsonwebtoken');
const { sendEmployeeCredentials } = require('./emailService'); // Import email function

// Middleware to verify JWT token and attach employee to request
const authenticateEmployee = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
    const employee = await Employee.findById(decoded.id).select('-password');
  
    if (!employee) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.employee = employee;
    next();
  };
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
    const employee = await Employee.findById(decoded.id).select('-password');
    
    if (!employee) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.employee = employee;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// GET /api/employee - list all employees (admin only)
router.get('/', async (req, res) => {
  try {
    const list = await Employee.find().sort({ employeeId: 1, createdAt: -1 }).lean();
    res.json(list);
  } catch (err) {
    console.error('GET /api/employee error', err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// GET /api/employee/my-profile - get logged in employee's own profile
router.get('/my-profile', authenticateEmployee, async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee._id)
      .select('-password') // Exclude password from response
      .lean();
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  } catch (err) {
    console.error('GET /api/employee/my-profile error', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// GET /api/employee/my-credentials - get logged in employee's credentials
router.get('/my-credentials', authenticateEmployee, async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee._id)
      .select('username email employeeId name')
      .lean();
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Return basic credential info (without password for security)
    res.json({
      employeeId: employee.employeeId,
      username: employee.username,
      email: employee.email,
      name: employee.name,
      loginUrl: process.env.APP_URL || 'http://localhost:5000',
      message: 'Please contact HR if you need your password reset.'
    });
  } catch (err) {
    console.error('GET /api/employee/my-credentials error', err);
    res.status(500).json({ error: 'Failed to fetch credentials' });
  }
});

// POST /api/employee/reset-password-request - request password reset
router.post('/reset-password-request', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const employee = await Employee.findOne({ email });
    if (!employee) {
      // Don't reveal whether email exists for security
      return res.json({ 
        message: 'If your email exists in our system, you will receive a password reset link.' 
      });
    }

    // Generate temporary password
    const temporaryPassword = Math.random().toString(36).slice(-8) + 'A1!';
    employee.password = temporaryPassword;
    await employee.save();

    // Send email with temporary password
    const emailResult = await sendEmployeeCredentials({
      email: employee.email,
      name: employee.name,
      username: employee.username,
      password: temporaryPassword,
      employeeId: employee.employeeId
    });

    if (emailResult.success) {
      res.json({ 
        message: 'Temporary password has been sent to your email. Please check your inbox.' 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to send password reset email. Please contact HR.' 
      });
    }

  } catch (err) {
    console.error('POST /api/employee/reset-password-request error', err);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// POST /api/employee/change-password - change own password
router.post('/change-password', authenticateEmployee, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const employee = await Employee.findById(req.employee._id);
    
    // Verify current password
    const isMatch = await employee.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    employee.password = newPassword;
    await employee.save();

    res.json({ message: 'Password changed successfully' });

  } catch (err) {
    console.error('POST /api/employee/change-password error', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// GET /api/employee/next-employee-id - compute next numeric id and padded form
router.get('/next-employee-id', async (req, res) => {
  try {
    const doc = await Employee.findOne({ employeeId: { $exists: true, $ne: null } })
      .sort({ employeeId: -1 })
      .select('employeeId')
      .lean();
    const next = (doc && typeof doc.employeeId === 'number') ? doc.employeeId + 1 : 1;
    const padded = String(next).padStart(4, '0');
    res.json({ number: next, padded, raw: String(next) });
  } catch (err) {
    console.error('GET /api/employee/next-employee-id error', err);
    res.status(500).json({ error: 'Failed to compute next employee id' });
  }
});

// POST /api/employee - create employee (auto-increment employeeId when not provided)
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};

    // Basic input validation: require a name (or username/fullName)
    const name = body.name || body.fullName || body.username;
    if (!name || String(name).trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Validate email
    if (!body.email || String(body.email).trim() === '') {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Ensure department is present (schema may require it) - use provided or fallback
    const department = (body.department && String(body.department).trim() !== '') ? body.department : 'General';

    // determine numeric employeeId
    let employeeId = (typeof body.employeeId === 'number') ? body.employeeId : undefined;
    if (employeeId === undefined) {
      const last = await Employee.findOne({ employeeId: { $exists: true, $ne: null } })
        .sort({ employeeId: -1 })
        .select('employeeId')
        .lean();
      employeeId = (last && typeof last.employeeId === 'number') ? last.employeeId + 1 : 1;
    }

    // Generate username if not provided (first name + last initial)
    let username = body.username;
    if (!username) {
      const nameParts = name.split(' ');
      const firstName = nameParts[0].toLowerCase();
      const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0).toLowerCase() : '';
      username = `${firstName}${lastInitial}`;
      
      // Check if username already exists and append numbers if needed
      let counter = 1;
      let tempUsername = username;
      while (await Employee.findOne({ username: tempUsername })) {
        tempUsername = `${username}${counter}`;
        counter++;
      }
      username = tempUsername;
    }

    // Generate random password if not provided
    let password = body.password;
    if (!password) {
      password = Math.random().toString(36).slice(-10) + 'A1!';
    }

    const doc = new Employee({
      username: username,
      name: name,
      department,
      email: body.email,
      password: password,
      role: body.role || 'employee',
      employeeId,
      employeeCode: body.employeeCode || undefined,
      jobTitle: body.jobTitle,
      contactNumber: body.contactNumber || body.contact || '',
      status: body.status || 'active',
      dateHired: body.dateHired ? new Date(body.dateHired) : undefined,
      shift: body.shift,
      notes: body.notes || ''
    });

    await doc.save();

    // Send email with credentials
    const emailResult = await sendEmployeeCredentials({
      email: body.email,
      name: name,
      username: username,
      password: password,
      employeeId: employeeId
    });

    if (emailResult.success) {
      res.status(201).json({ 
        message: 'Employee created successfully and credentials email sent!', 
        id: doc._id, 
        employeeId: doc.employeeId,
        emailSent: true
      });
    } else {
      // Employee was saved but email failed
      res.status(201).json({
        message: `Employee created successfully! /@ Email failed: ${emailResult.error}`,
        id: doc._id,
        employeeId: doc.employeeId,
        emailSent: false,
        manualPassword: password, // Include password in response for manual sharing
        emailError: emailResult.error
      });
    }

  } catch (err) {
    console.error('POST /api/employee error', err);

    // duplicate key (unique) error
    if (err && err.code === 11000) {
      return res.status(400).json({
        error: 'Duplicate field error',
        details: err.keyValue || {}
      });
    }

    // Mongoose validation errors
    if (err && err.name === 'ValidationError' && err.errors) {
      const details = Object.keys(err.errors).reduce((acc, key) => {
        acc[key] = err.errors[key].message;
        return acc;
      }, {});
      return res.status(400).json({
        error: 'Validation failed',
        details
      });
    }

    // Fallback: send the original error message when available
    return res.status(500).json({
      error: err && (err.message || String(err)) ? (err.message || String(err)) : 'Failed to create employee'
    });
  }
});

// POST /api/employee/login - authenticate employee by email or username
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // allow login by email or username
    const emp = await Employee.findOne({ $or: [{ email }, { username: email }] });
    if (!emp) return res.status(401).json({ error: 'Invalid credentials' });

    // ensure password is set on employee record
    if (!emp.password) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await emp.comparePassword(password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = { 
      id: emp._id, 
      role: emp.role || 'employee', 
      username: emp.username, 
      name: emp.name,
      employeeId: emp.employeeId
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'changeme', { expiresIn: '7d' });

    res.json({ 
      token, 
      role: payload.role, 
      username: payload.username, 
      name: payload.name,
      employeeId: payload.employeeId
    });
  } catch (err) {
    console.error('POST /api/employee/login error', err);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// DELETE /api/employee/:id - delete by _id or employeeCode or numeric employeeId
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let removed = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      removed = await Employee.findByIdAndDelete(id);
    }
    if (!removed) {
      const empIdNum = Number.isFinite(Number(id)) ? parseInt(id, 10) : null;
      removed = await Employee.findOneAndDelete({ $or: [{ employeeCode: id }, { employeeId: empIdNum }] });
    }
    if (!removed) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    console.error('DELETE /api/employee/:id error', err);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

module.exports = router;
>>>>>>> origin/MALONG
