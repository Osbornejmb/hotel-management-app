const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Attendance = require('./attendances');
const fs = require('fs');
const path = require('path');

// Load employee data from JSON
const employeesPath = path.join(__dirname, 'employees.json');
function getEmployeeById(employeeId) {
  try {
    if (!fs.existsSync(employeesPath)) {
      console.error('employees.json file not found');
      return null;
    }
    const employees = JSON.parse(fs.readFileSync(employeesPath, 'utf8'));
    return employees.find(emp => emp.employeeId === employeeId);
  } catch (err) {
    console.error('Error reading employees.json:', err);
    return null;
  }
}

// Helper to get current date string
function getDateString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Attendance route
router.post('/attendance', async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ error: 'Employee ID is required' });

    const employee = getEmployeeById(employeeId);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const today = getDateString();
    let attendance = await Attendance.findOne({ employeeId, date: today });

    if (!attendance) {
      // Clock in
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
    } else {
      // Already clocked out, prevent duplicate clock-ins
      return res.status(400).json({ error: 'Employee has already clocked out for today.' });
    }
  } catch (err) {
    console.error('Error in attendance route:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
