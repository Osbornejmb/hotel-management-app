const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Employee
const Employee = require('./employee'); // Employee model
// Attendance
const Attendance = mongoose.model('Attendance', new mongoose.Schema({
  employeeId: String,
  employeeName: String,
  clockIn: Date,
  clockOut: Date,
  totalHours: Number,
  date: String // YYYY-MM-DD
}));

// Helper to get current date string
function getDateString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

router.post('/attendance', async (req, res) => {
  const { employeeId } = req.body;
  if (!employeeId) return res.status(400).json({ error: 'employeeId required' });

  // Find employee
  const employee = await Employee.findOne({ employeeId });
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  const today = getDateString();
  // Find latest attendance for today
  let attendance = await Attendance.findOne({ employeeId, date: today }).sort({ clockIn: -1 });

  if (!attendance || (attendance && attendance.clockOut)) {
    // Clock in (first time today or after clocking out)
    attendance = new Attendance({
      employeeId,
      employeeName: employee.employeeName,
      clockIn: new Date(),
      date: today
    });
    await attendance.save();
    return res.json({
      status: 'clocked-in',
      employeeName: employee.employeeName,
      clockIn: attendance.clockIn
    });
  } else if (!attendance.clockOut) {
    // Clock out
    attendance.clockOut = new Date();
    attendance.totalHours = (attendance.clockOut - attendance.clockIn) / (1000 * 60 * 60); // hours
    await attendance.save();
    return res.json({
      status: 'clocked-out',
      employeeName: employee.employeeName,
      clockOut: attendance.clockOut,
      totalHours: attendance.totalHours
    });
  }
});

// GET all attendance records (for payroll calculation)
router.get('/attendances', async (req, res) => {
  try {
    const attendanceRecords = await Attendance.find({});
    return res.json(attendanceRecords);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET attendance records for a specific employee
router.get('/attendances/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const attendanceRecords = await Attendance.find({ employeeId });
    if (attendanceRecords.length === 0) {
      return res.status(404).json({ error: 'No attendance records found for this employee' });
    }
    return res.json(attendanceRecords);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
