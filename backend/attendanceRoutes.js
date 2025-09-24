const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  clockIn: { type: Date },
  clockOut: { type: Date },
  totalHours: { type: Number }
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

// Employee Schema (reference your existing collection)
const employeeSchema = new mongoose.Schema({
  employeeId: String,
  fullName: String,
  position: String,
  department: String,
  contactNumber: String,
  email: String,
  dateHired: Date,
  status: String,
  shift: String,
  notes: String
});

const Employee = mongoose.model("Employee", employeeSchema, "employee");

router.post("/tap", async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    let activeSession = await Attendance.findOne({
      employeeId,
      clockOut: { $exists: false }
    });

    let attendanceRecord;

    if (!activeSession) {
      // CLOCK IN
      attendanceRecord = new Attendance({
        employeeId,
        clockIn: new Date()
      });
      await attendanceRecord.save();
      return res.json({
        message: "Clocked in",
        employee: employee.fullName,
        data: attendanceRecord
      });
    } else {
      // CLOCK OUT
      activeSession.clockOut = new Date();
      const diffMs = activeSession.clockOut - activeSession.clockIn;
      activeSession.totalHours = diffMs / (1000 * 60 * 60);
      await activeSession.save();

      return res.json({
        message: "Clocked out",
        employee: employee.fullName,
        data: activeSession
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;