const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Employee = require('./Employee'); // use existing Employee.js model
const jwt = require('jsonwebtoken');

// GET /api/employee - list all employees
router.get('/', async (req, res) => {
  try {
    const list = await Employee.find().sort({ employeeId: 1, createdAt: -1 }).lean();
    res.json(list);
  } catch (err) {
    console.error('GET /api/employee error', err);
    res.status(500).json({ error: 'Failed to fetch employees' });
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

    const doc = new Employee({
      username: body.username,
      name: name,
      department,
      email: body.email,
      password: body.password,
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
    res.status(201).json({ message: 'Employee created', id: doc._id, employeeId: doc.employeeId });
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

    const payload = { id: emp._id, role: emp.role || 'employee', username: emp.username, name: emp.name };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'changeme', { expiresIn: '7d' });

    res.json({ token, role: payload.role, username: payload.username, name: payload.name });
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
