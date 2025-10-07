
require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require('http');
const { Server } = require('socket.io');
const userRoutes = require("./userRoutes");
const roomRoutes = require("./roomRoutes");
const cartRoutes = require("./cartRoutes");
const employeeRoutes = require("./employeeRoutes");
const contactRoutes = require("./contactRoutes");
const customerRoutes = require("./customerRoutes");
const checkoutRoutes = require("./checkoutRoutes");
const foodRoutes = require("./foodRoutes");
const requestRoutes = require("./requestRoutes");
const bookingRoutes = require("./bookingRoutes");
const taskRoutes = require("./taskRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/contact", contactRoutes);
// app.use("/api/reservations", reservationRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/checkout", checkoutRoutes);

app.use("/api/requests", requestRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/tasks", taskRoutes);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected");
    // Start watching bookings collection for changes and emit socket events
    try {
      const Booking = require('./Booking');
      const changeStream = Booking.watch([], { fullDocument: 'updateLookup' });
      changeStream.on('change', async (change) => {
        try {
          if (change.operationType === 'update' || change.operationType === 'replace') {
            const full = change.fullDocument || (change.updateDescription && change.updateDescription.updatedFields ? null : null);
            const doc = full || await Booking.findById(change.documentKey._id).lean();
            if (!doc) return;
            // Determine status field
            const newStatus = doc.bookingStatus || doc.status || doc.paymentStatus || null;
            io.emit('bookingStatusChanged', { bookingId: doc._id, roomNumber: doc.roomNumber || (doc.room && doc.room.roomNumber) || 'Unknown', newStatus });
          }
        } catch (err) {
          console.error('Change stream processing error:', err);
        }
      });
      changeStream.on('error', err => console.error('Change stream error:', err));
      // Also watch the rooms collection for status changes
      try {
        const Room = require('./Room');
        const roomStream = Room.watch([], { fullDocument: 'updateLookup' });
        roomStream.on('change', async (change) => {
          try {
            if (change.operationType === 'update' || change.operationType === 'replace') {
              const doc = change.fullDocument || await Room.findById(change.documentKey._id).lean();
              if (!doc) return;
              const status = doc.status || null;
              io.emit('roomStatusChanged', { roomId: doc._id, roomNumber: doc.roomNumber || 'Unknown', roomType: doc.roomType || 'Unknown', status });
            }
          } catch (err) {
            console.error('Room change stream processing error:', err);
          }
        });
        roomStream.on('error', err => console.error('Room change stream error:', err));
      } catch (err) {
        console.error('Error setting up room change stream:', err);
      }
      // Also watch the tasks collection for changes
      try {
        const Task = require('./Task');
        const taskStream = Task.watch([], { fullDocument: 'updateLookup' });
        taskStream.on('change', async (change) => {
          try {
            console.log('[Task Change Stream] Change event:', JSON.stringify(change, null, 2));
            if (change.operationType === 'insert' || change.operationType === 'update' || change.operationType === 'replace') {
              const doc = change.fullDocument || await Task.findById(change.documentKey._id).lean();
              if (!doc) {
                console.log('[Task Change Stream] No document found for change:', change);
                return;
              }
              const payload = {
                taskId: doc.taskId || doc._id,
                room: doc.room || doc.roomNumber || 'Unknown',
                employeeId: doc.employeeId || doc.assignedTo || 'Unknown',
                type: doc.type || doc.jobTitle || 'Unknown',
                status: doc.status || 'Unknown'
              };
              console.log('[Task Change Stream] Emitting taskChanged:', payload);
              io.emit('taskChanged', payload);
            } else {
              console.log('[Task Change Stream] Ignored operationType:', change.operationType);
            }
          } catch (err) {
            console.error('Task change stream processing error:', err);
          }
        });
        taskStream.on('error', err => console.error('Task change stream error:', err));
      } catch (err) {
        console.error('Error setting up task change stream:', err);
      }
    } catch (err) {
      console.error('Error setting up change stream:', err);
    }
  })
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("Hello from backend!");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
