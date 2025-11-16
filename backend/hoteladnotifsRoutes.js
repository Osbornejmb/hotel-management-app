const express = require('express');
const router = express.Router();
const HotelAdNotif = require('./HotelAdNotif');

// POST /api/hoteladnotifs - save a notification payload
router.post('/', async (req, res) => {
  try {
    const payload = req.body || {};
  // incoming payload received
    // small server-side duplicate guard: if a notif with same bookingId/taskId/newStatus
    // was saved within the last 10 seconds, skip insert to avoid double writes from race conditions
    try {
      const tenSecAgo = new Date(Date.now() - 10000);
      const q = { newStatus: payload.newStatus };
      if (payload.bookingId) q.bookingId = payload.bookingId;
      if (payload.taskId) q.taskId = payload.taskId;
      if (!payload.bookingId && !payload.taskId && payload.roomNumber) {
        q.roomNumber = payload.roomNumber;
      }
      q.timestamp = { $gte: tenSecAgo };
      const exists = await HotelAdNotif.findOne(q).lean();
      if (exists) {
        // duplicate detected within short window — skip insert
        return res.status(200).json({ success: true, skippedDuplicate: true, id: exists._id });
      }
    } catch (err) {
      console.error('[hoteladnotifs] duplicate check error', err);
    }

    const doc = new HotelAdNotif({
      bookingId: payload.bookingId,
      taskId: payload.taskId,
      roomNumber: payload.roomNumber,
      roomType: payload.roomType,
      employeeId: payload.employeeId,
      taskType: payload.taskType,
      oldStatus: payload.oldStatus,
      newStatus: payload.newStatus,
      isRoomNotification: !!payload.isRoomNotification,
      isTaskNotification: !!payload.isTaskNotification,
      raw: payload,
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      read: payload.read || false,
    });
    await doc.save();
  // saved notification id: doc._id
    res.status(201).json({ success: true, id: doc._id });
  } catch (err) {
    console.error('Error saving hotel ad notif', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// simple GET for quick verification (returns last 25)
router.get('/', async (req, res) => {
  try {
    const docs = await HotelAdNotif.find().sort({ timestamp: -1 }).limit(25).lean();
    res.json(docs);
  } catch (err) {
    console.error('[hoteladnotifs] GET error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
