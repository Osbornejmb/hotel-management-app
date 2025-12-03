const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Attendance = require('./attendances');
const Employee = require('./employee');
const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/attendance');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper to get current date string
function getDateString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Helper to save image locally
function saveImageLocally(imageData, cardId, type) {
  try {
    if (!imageData) return null;

    // Remove the data:image/jpeg;base64, prefix if present
    const base64Data = imageData.replace(/^data:image\/jpeg;base64,/, '');
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${cardId}_${type}_${timestamp}.jpg`;
    const filepath = path.join(uploadsDir, filename);
    
    // Save file
    fs.writeFileSync(filepath, base64Data, 'base64');
    console.log(`Image saved: ${filename}`);
    return filename;
  } catch (err) {
    console.error('Error saving image:', err);
    return null;
  }
}

// Attendance route
router.post('/attendance', async (req, res) => {
  try {
    const { cardId } = req.body;
    console.log('Request received with cardId:', cardId);
    if (!cardId) return res.status(400).json({ error: 'Card ID is required' });

    // Fetch employee by cardId from MongoDB database
    console.log('Searching for employee with cardId:', cardId);
    const employee = await Employee.findOne({ cardId });
    console.log('Employee found:', employee);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const today = getDateString();
    let attendance = await Attendance.findOne({ cardId: employee.cardId, date: today });
    console.log('Existing attendance record for today:', attendance);

    if (!attendance) {
      // Check if employee clocked out yesterday and if 24hr cooldown has passed
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];
      
      const yesterdayAttendance = await Attendance.findOne({ cardId: employee.cardId, date: yesterdayString });
      console.log('Yesterday attendance record:', yesterdayAttendance);
      
      if (yesterdayAttendance && yesterdayAttendance.clockOut) {
        const clockOutTime = new Date(yesterdayAttendance.clockOut);
        const currentTime = new Date();
        const timeSinceClockOut = (currentTime - clockOutTime) / (1000 * 60); // minutes
        
        // Need to wait 24 hours (1440 minutes) from yesterday's clock out time
        const cooldownMinutes = 24 * 60;
        if (timeSinceClockOut < cooldownMinutes) {
          const remainingMinutes = Math.ceil(cooldownMinutes - timeSinceClockOut);
          const remainingSeconds = Math.ceil((remainingMinutes * 60) - (timeSinceClockOut * 60 * 60 / 1000));
          return res.status(400).json({ 
            error: `24-hour cooldown in effect. Please wait ${remainingMinutes} minute(s) before clocking in again.`,
            remainingMinutes,
            remainingSeconds: Math.max(0, remainingSeconds)
          });
        }
      }
      
      // Clock in
      attendance = await Attendance.create({
        cardId: employee.cardId,
        name: employee.name,
        clockIn: new Date(),
        date: today
      });
      console.log('Creating new clock-in record:', attendance);
      return res.json({
        status: 'clocked-in',
        name: employee.name,
        clockIn: attendance.clockIn
      });
    } else if (!attendance.clockOut) {
      // Clock out - check 30 minute minimum work time
      const clockOutTime = new Date();
      const timeSinceClockIn = (clockOutTime - attendance.clockIn) / (1000 * 60); // minutes
      
      // Minimum 30 minutes between clock in and clock out
      if (timeSinceClockIn < 30) {
        const remainingMinutes = Math.ceil(30 - timeSinceClockIn);
        return res.status(400).json({ 
          error: `Please work at least 30 minutes before clocking out. ${remainingMinutes} minute(s) remaining.`,
          remainingMinutes
        });
      }
      
      attendance.clockOut = clockOutTime;
      attendance.totalHours = (attendance.clockOut - attendance.clockIn) / (1000 * 60 * 60); // hours
      console.log('Updating clock-out record:', attendance);
      await attendance.save();
      console.log('Employee clocked out');
      return res.json({
        status: 'clocked-out',
        name: employee.name,
        clockOut: attendance.clockOut,
        totalHours: attendance.totalHours
      });
    } else {
      // Already clocked out today
      return res.status(400).json({ error: 'Employee has already clocked out for today.' });
    }
  } catch (err) {
    console.error('Error in attendance route:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

module.exports = router;
