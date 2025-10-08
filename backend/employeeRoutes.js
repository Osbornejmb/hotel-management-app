const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Employee = require('./Employee');
const jwt = require('jsonwebtoken');
const { sendEmployeeCredentials } = require('./emailService');

// Middleware to check if employee is authenticated
const requireEmployeeAuth = (req, res, next) => {
  console.log('🔐 Auth check - Session ID:', req.sessionID);
  console.log('🔐 Auth check - Session data:', req.session);
  
  if (!req.session.employee) {
    return res.status(401).json({ 
      error: 'Authentication required',
      authenticated: false 
    });
  }
  next();
};

// ========== AUTHENTICATION ROUTES ==========

// GET /api/employee/check-auth - check if employee is authenticated
router.get('/check-auth', (req, res) => {
  console.log('🔐 Check-auth - Session ID:', req.sessionID);
  console.log('🔐 Check-auth - Session data:', req.session);
  
  if (req.session.employee) {
    res.json({ 
      authenticated: true, 
      employee: req.session.employee,
      sessionId: req.sessionID
    });
  } else {
    res.json({ 
      authenticated: false,
      sessionId: req.sessionID
    });
  }
});

// POST /api/employee/login - authenticate employee by email or username
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    console.log('🔐 Login attempt for:', email);
    console.log('🔐 Session ID at start:', req.sessionID);
    console.log('🔐 Session data at start:', req.session);
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Allow login by email or username, only active employees
    const emp = await Employee.findOne({ 
      $or: [{ email }, { username: email }],
      status: 'active'
    });
    
    if (!emp) {
      console.log('❌ Employee not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('🔐 Found employee:', emp.name, 'ID:', emp._id);

    // Ensure password is set
    if (!emp.password) {
      console.log('❌ No password set for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('🔐 Comparing passwords...');
    const match = await emp.comparePassword(password);
    if (!match) {
      console.log('❌ Password mismatch for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Password match successful!');

    // Create session - MAKE SURE THIS IS SET
    req.session.employee = {
      id: emp._id.toString(),
      employeeId: emp.employeeId,
      employeeCode: emp.employeeCode,
      name: emp.name,
      email: emp.email,
      username: emp.username,
      role: emp.role || 'employee',
      jobTitle: emp.jobTitle,
      department: emp.department,
      status: emp.status
    };

    console.log('🔐 Session after setting employee data:', req.session);
    console.log('🔐 Employee data set in session:', req.session.employee);

    // Save session explicitly
    return new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('❌ Session save error:', err);
          reject(err);
        } else {
          console.log('💾 Session saved successfully!');
          console.log('🔐 Final session after save:', req.session);
          console.log('🔐 Employee in final session:', req.session.employee);
          
          // Generate JWT token
          const token = jwt.sign(
            { 
              id: emp._id, 
              role: emp.role || 'employee', 
              username: emp.username, 
              name: emp.name 
            }, 
            process.env.JWT_SECRET || 'secretkey', 
            { expiresIn: '7d' }
          );

          res.json({ 
            success: true,
            message: 'Login successful',
            token,
            employee: req.session.employee,
            sessionId: req.sessionID
          });
          resolve();
        }
      });
    });

  } catch (err) {
    console.error('❌ POST /api/employee/login error', err);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});



// POST /api/employee/logout - logout employee
router.post('/logout', (req, res) => {
  console.log('🔐 Logout for session:', req.sessionID);
  
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    
    res.clearCookie('employee_session'); // Use the correct cookie name
    res.json({ 
      success: true, 
      message: 'Logout successful' 
    });
  });
});

// ========== PROTECTED ROUTES ==========

// GET /api/employee/profile - get current employee profile (PROTECTED)
router.get('/profile', requireEmployeeAuth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.session.employee.id)
      .select('-password') // Exclude password
      .lean();

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ employee });
  } catch (err) {
    console.error('GET /api/employee/profile error', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// GET /api/employee/dashboard - employee dashboard (PROTECTED)
router.get('/dashboard', requireEmployeeAuth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.session.employee.id)
      .select('-password')
      .lean();

    // You can add dashboard-specific data here
    const dashboardData = {
      upcomingShifts: [],
      recentActivities: [],
      announcements: [],
      // Add more dashboard data as needed
    };

    res.json({
      message: 'Welcome to your dashboard',
      employee,
      dashboardData
    });
  } catch (err) {
    console.error('GET /api/employee/dashboard error', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// PUT /api/employee/profile - update employee profile (PROTECTED)
router.put('/profile', requireEmployeeAuth, async (req, res) => {
  try {
    const { name, contactNumber, email } = req.body;
    
    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.session.employee.id,
      {
        $set: {
          ...(name && { name }),
          ...(contactNumber && { contactNumber }),
          ...(email && { email })
        }
      },
      { new: true, runValidators: true }
    ).select('-password');

    // Update session if name changed
    if (name) {
      req.session.employee.name = name;
      req.session.save(); // Save the updated session
    }

    res.json({
      message: 'Profile updated successfully',
      employee: updatedEmployee
    });
  } catch (err) {
    console.error('PUT /api/employee/profile error', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT /api/employee/change-password - change password (PROTECTED)
router.put('/change-password', requireEmployeeAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const employee = await Employee.findById(req.session.employee.id);
    
    // Verify current password
    const isMatch = await employee.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    employee.password = newPassword;
    await employee.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('PUT /api/employee/change-password error', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ========== PUBLIC ROUTES ==========

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

    // Send email with credentials after successful employee creation
    let emailSent = false;
    let emailError = null;
    
    if (body.email) {
      try {
        const emailResult = await sendEmployeeCredentials({
          email: body.email,
          name: name,
          username: body.username || name,
          password: body.password, // The auto-generated password from frontend
          employeeId: body.employeeCode || String(employeeId).padStart(4, '0')
        });
        
        emailSent = emailResult.success;
        if (!emailResult.success) {
          emailError = emailResult.error;
          console.warn('Employee created but email failed:', emailError);
        }
      } catch (emailErr) {
        emailError = emailErr.message;
        console.warn('Employee created but email failed:', emailError);
      }
    }

    res.status(201).json({ 
      message: 'Employee created', 
      id: doc._id, 
      employeeId: doc.employeeId,
      emailSent,
      emailError 
    });
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