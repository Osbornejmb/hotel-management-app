const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Employee
const Employee = require('./employee'); // Employee model
// Attendance
const AttendanceSchema = new mongoose.Schema({
  cardId: String,
  name: String,
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
  const { cardId } = req.body;
  if (!cardId) return res.status(400).json({ error: 'cardId required' });

  // Find employee by cardId
  const employee = await Employee.findOne({ cardId });
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  const today = getDateString();
  // Find latest attendance for today
  let attendance = await Attendance.findOne({ cardId, date: today }).sort({ clockIn: -1 });

  if (!attendance || (attendance && attendance.clockOut)) {
    // Clock in (first time today or after clocking out)
    attendance = new Attendance({
      cardId,
      name: employee.name,
      clockIn: new Date(),
      date: today
    });
    await attendance.save();
    return res.json({
      status: 'clocked-in',
      name: employee.name,
      clockIn: attendance.clockIn
    });
  } else if (!attendance.clockOut) {
    // Clock out
    attendance.clockOut = new Date();
    attendance.totalHours = (attendance.clockOut - attendance.clockIn) / (1000 * 60 * 60); // hours
    await attendance.save();
    return res.json({
      status: 'clocked-out',
      name: employee.name,
      clockOut: attendance.clockOut,
      totalHours: attendance.totalHours
    });
  }
});

// GET all attendance records (for payroll calculation)
router.get('/', async (req, res) => {
  try {
    const attendanceRecords = await Attendance.find({});
    console.log(`[attendanceRoutes] GET / - returning ${attendanceRecords.length} records from ${req.ip}`);

    // Normalize records to ensure frontend receives consistent types
    const normalized = attendanceRecords.map(rec => {
      const obj = rec.toObject ? rec.toObject() : rec;
      return {
        _id: obj._id,
        cardId: String(obj.cardId || ''),
        name: obj.name || '',
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
router.get('/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params;
    const attendanceRecords = await Attendance.find({ cardId });
    if (attendanceRecords.length === 0) {
      return res.status(404).json({ error: 'No attendance records found for this employee' });
    }

    // Normalize similar to GET /
    const normalized = attendanceRecords.map(rec => {
      const obj = rec.toObject ? rec.toObject() : rec;
      return {
        _id: obj._id,
        cardId: String(obj.cardId || ''),
        name: obj.name || '',
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
