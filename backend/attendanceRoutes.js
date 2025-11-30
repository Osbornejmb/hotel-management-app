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
  const { cardId, employeeId } = req.body;
  const id = cardId || employeeId;
  const nameParam = req.body.name || req.body.employeeName;
  
  if (!id) return res.status(400).json({ error: 'cardId or employeeId required' });

  // Find employee by either cardId or employeeId
  let employee = null;
  if (cardId) {
    employee = await Employee.findOne({ cardId });
  } else if (employeeId) {
    employee = await Employee.findOne({ employeeId });
  }
  
  if (!employee && !nameParam) return res.status(404).json({ error: 'Employee not found and no name provided' });

  const today = getDateString();
  // Find latest attendance for today - support both field names
  let attendance = await Attendance.findOne({ 
    $or: [{ cardId: id }, { employeeId: id }],
    date: today 
  }).sort({ clockIn: -1 });

  if (!attendance || (attendance && attendance.clockOut)) {
    // Clock in (first time today or after clocking out)
    attendance = new Attendance({
      cardId: id,
      employeeId: id,
      name: nameParam || (employee ? employee.name : 'Unknown'),
      employeeName: nameParam || (employee ? employee.name : 'Unknown'),
      clockIn: new Date(),
      date: today
    });
    await attendance.save();
    return res.json({
      status: 'clocked-in',
      name: attendance.name,
      clockIn: attendance.clockIn
    });
  } else if (!attendance.clockOut) {
    // Clock out
    attendance.clockOut = new Date();
    attendance.totalHours = (attendance.clockOut - attendance.clockIn) / (1000 * 60 * 60); // hours
    await attendance.save();
    return res.json({
      status: 'clocked-out',
      name: attendance.name,
      clockOut: attendance.clockOut,
      totalHours: attendance.totalHours
    });
  }
});

// GET all attendance records (for payroll calculation)
router.get('/', async (req, res) => {
  try {
    const attendanceRecords = await Attendance.find({});
    console.log(`[attendanceRoutes] GET / - found ${attendanceRecords.length} records`);

    // Normalize records to ensure frontend receives consistent types
    const normalized = attendanceRecords.map(rec => {
      const obj = rec.toObject ? rec.toObject() : rec;
      // Support both old and new schema formats
      const cardId = obj.cardId || obj.employeeId || '';
      const name = obj.name || obj.employeeName || '';
      
      console.log(`[attendanceRoutes] Normalizing record: cardId=${cardId}, name=${name}, totalHours=${obj.totalHours}`);
      
      return {
        _id: obj._id,
        cardId: String(cardId),
        name: String(name),
        clockIn: obj.clockIn || null,
        clockOut: obj.clockOut || null,
        totalHours: typeof obj.totalHours === 'number' ? obj.totalHours : Number(obj.totalHours) || 0,
        date: obj.date || new Date().toISOString().split('T')[0]
      };
    });
    
    console.log(`[attendanceRoutes] Returning ${normalized.length} normalized records`);
    return res.json(normalized);
  } catch (error) {
    console.error(`[attendanceRoutes] GET / error:`, error.message);
    return res.status(500).json({ error: error.message });
  }
});

// GET attendance records for a specific employee
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[attendanceRoutes] GET /:id - searching for id: ${id}`);
    
    // Try to find by cardId or employeeId
    let attendanceRecords = await Attendance.find({ 
      $or: [{ cardId: id }, { employeeId: id }]
    });
    
    console.log(`[attendanceRoutes] Found ${attendanceRecords.length} records for id: ${id}`);
    
    if (attendanceRecords.length === 0) {
      console.log(`[attendanceRoutes] No records found for id: ${id}`);
      return res.status(404).json({ error: 'No attendance records found for this employee' });
    }

    // Normalize similar to GET /
    const normalized = attendanceRecords.map(rec => {
      const obj = rec.toObject ? rec.toObject() : rec;
      // Support both old and new schema formats
      const cardId = obj.cardId || obj.employeeId || '';
      const name = obj.name || obj.employeeName || '';
      
      return {
        _id: obj._id,
        cardId: String(cardId),
        name: String(name),
        clockIn: obj.clockIn || null,
        clockOut: obj.clockOut || null,
        totalHours: typeof obj.totalHours === 'number' ? obj.totalHours : Number(obj.totalHours) || 0,
        date: obj.date || new Date().toISOString().split('T')[0]
      };
    });
    
    console.log(`[attendanceRoutes] Returning ${normalized.length} records for id: ${id}`);
    return res.json(normalized);
  } catch (error) {
    console.error(`[attendanceRoutes] GET /:id error:`, error.message);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
