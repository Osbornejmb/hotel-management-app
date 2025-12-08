const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Employee
const Employee = require('./Employee'); // Employee model (use correct filename casing)
// Attendance
const AttendanceSchema = new mongoose.Schema({
  cardId: String,          // Employee card ID
  name: String,            // Employee name
  employeeId: String,      // Keep for backward compatibility
  employeeName: String,    // Keep for backward compatibility
  clockIn: Date,
  clockOut: Date,
  totalHours: Number,
  date: String // YYYY-MM-DD
}, { collection: 'attendances' });

const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);

console.log('[attendanceRoutes] Attendance model using collection:', Attendance.collection && Attendance.collection.name);

// Helper to get current date string
function getDateString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

router.post('/', async (req, res) => {
  const { employeeId } = req.body;
  if (!employeeId) return res.status(400).json({ error: 'employeeId required' });

  // Find employee
  const employee = await Employee.findOne({ employeeId });
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  const today = getDateString();
  // Find latest attendance for today
  let attendance = await Attendance.findOne({ cardId: employee.cardId, date: today }).sort({ clockIn: -1 });

  if (!attendance || (attendance && attendance.clockOut)) {
    // Clock in (first time today or after clocking out)
    attendance = new Attendance({
      cardId: employee.cardId,
      name: employee.name || employee.employeeName,
      employeeId,
      employeeName: employee.employeeName,
      clockIn: new Date(),
      date: today
    });
    await attendance.save();
    return res.json({
      status: 'clocked-in',
      name: employee.name || employee.employeeName,
      cardId: employee.cardId,
      clockIn: attendance.clockIn
    });
  } else if (!attendance.clockOut) {
    // Clock out
    attendance.clockOut = new Date();
    attendance.totalHours = (attendance.clockOut - attendance.clockIn) / (1000 * 60 * 60); // hours
    await attendance.save();
    return res.json({
      status: 'clocked-out',
      name: employee.name || employee.employeeName,
      cardId: employee.cardId,
      clockOut: attendance.clockOut,
      totalHours: attendance.totalHours
    });
  }
});

// GET all attendance records (for payroll calculation)
router.get('/', async (req, res) => {
  try {
    const { cardId } = req.query;
    
    let filter = {};
    if (cardId) {
      filter = { cardId: cardId };
    }
    
    const attendanceRecords = await Attendance.find(filter);
    console.log(`[attendanceRoutes] GET / - returning ${attendanceRecords.length} records for cardId: ${cardId || 'all'} from ${req.ip}`);

    // Normalize records to ensure frontend receives consistent types
    const normalized = attendanceRecords.map(rec => {
      const obj = rec.toObject ? rec.toObject() : rec;
      return {
        _id: obj._id,
        cardId: String(obj.cardId || obj.employeeId || ''),
        name: obj.name || obj.employeeName || '',
        employeeId: String(obj.employeeId || ''),
        employeeName: obj.employeeName || '',
        clockIn: obj.clockIn || null,
        clockOut: obj.clockOut || null,
        totalHours: typeof obj.totalHours === 'number' ? obj.totalHours : Number(obj.totalHours) || 0,
        date: obj.date || ''
      };
    });

    return res.json(normalized);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET attendance records for a specific employee
router.get('/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const attendanceRecords = await Attendance.find({ employeeId });
    if (attendanceRecords.length === 0) {
      return res.status(404).json({ error: 'No attendance records found for this employee' });
    }

    // Normalize similar to GET /
    const normalized = attendanceRecords.map(rec => {
      const obj = rec.toObject ? rec.toObject() : rec;
      return {
        _id: obj._id,
        cardId: String(obj.cardId || obj.employeeId || ''),
        name: obj.name || obj.employeeName || '',
        employeeId: String(obj.employeeId || ''),
        employeeName: obj.employeeName || '',
        clockIn: obj.clockIn || null,
        clockOut: obj.clockOut || null,
        totalHours: typeof obj.totalHours === 'number' ? obj.totalHours : Number(obj.totalHours) || 0,
        date: obj.date || ''
      };
    });

    return res.json(normalized);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
