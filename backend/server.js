require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require('http');
const { Server } = require('socket.io');
const userRoutes = require("./userRoutes");
const roomRoutes = require("./roomRoutes");
const cartRoutes = require("./cartRoutes");
const contactRoutes = require("./contactRoutes");
const customerRoutes = require("./customerRoutes");
const checkoutRoutes = require("./checkoutRoutes");
const foodRoutes = require("./foodRoutes");
const employeeRoutes = require("./employeeRoutes");
const requestRoutes = require("./requestRoutes");
<<<<<<< HEAD
const bookingRoutes = require("./bookingRoutes");
const carouselRoutes = require("./carouselRoutes");

const activityLogRoutes = require("./activityLogRoutes");
const taskRoutes = require("./taskRoutes");
const hotelAdNotifsRoutes = require("./hoteladnotifsRoutes");
const analyticsRoutes = require("./analyticsRoutes");

const app = express();

// Configure CORS for production and development.
// Normalize configured frontend URLs (remove trailing slash) so we don't fail on minor mismatches.
// Support comma-separated list of allowed origins for flexibility with preview/branch deployments.
const rawFrontendUrls = process.env.FRONTEND_URL || '';
const allowedOrigins = rawFrontendUrls
  .split(',')
  .map(url => url.trim().replace(/\/+$/, ''))
  .filter(url => url);

// Also allow localhost for development
allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');

const corsOptions = {
  origin: function (origin, callback) {
    // Allow non-browser requests (no origin)
    if (!origin) return callback(null, true);

    // Normalize incoming origin (remove trailing slash)
    const incomingOrigin = origin.replace(/\/+$/, '');

    // Check if origin is in allowed list
    if (allowedOrigins.includes(incomingOrigin)) {
      return callback(null, true);
    }

    // In development (not production), allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // In production, reject unlisted origins
    return callback(new Error('CORS: origin not allowed'), false);
  },
  credentials: true
};

app.use(cors(corsOptions));
=======
const taskRoutes = require('./taskRoutes');
const attendanceRoutes = require("./attendanceRoutes");
const { sendEmployeeCredentials, testEmail } = require("./emailService");
const notificationRoutes = require('./notificationRoutes');

const app = express();

// Configure CORS for production and development.
const rawFrontendUrls = process.env.FRONTEND_URL || '';
const allowedOrigins = rawFrontendUrls
  .split(',')
  .map(url => url.trim().replace(/\/+$/, ''))
  .filter(url => url);

allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const incomingOrigin = origin.replace(/\/+$/, '');
    if (allowedOrigins.includes(incomingOrigin)) return callback(null, true);
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    return callback(new Error('CORS: origin not allowed'), false);
  },
  credentials: true
};

app.use(cors(corsOptions));
>>>>>>> origin/MALONG
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // Your frontend URL
    methods: ["GET", "POST"]
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their room for personalized notifications
  socket.on('join-user', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to other routes
app.set('io', io);

// Routes - include all routes from both branches
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/carousel", carouselRoutes);
app.use('/api/employee', employeeRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/bookings", bookingRoutes);

app.use("/api/activitylogs", activityLogRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/hoteladnotifs", hotelAdNotifsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use('/api/attendances', attendanceRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationRoutes);

// Test email endpoint from other branch
app.get("/api/test-email", async (req, res) => {
  try {
    console.log('Testing email configuration...');
    const result = await testEmail();
    if (result) {
      res.json({ success: true, message: "Email test completed successfully" });
    } else {
      res.status(500).json({ success: false, message: "Email test failed" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.use('/api/employee', employeeRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/tasks", taskRoutes);
// Mount attendance routes at both plural and singular for compatibility
app.use('/api/attendances', attendanceRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationRoutes);

// Test email endpoint
app.get("/api/test-email", async (req, res) => {
  try {
    console.log('Testing email configuration...');
    const result = await testEmail();
    if (result) {
      res.json({ success: true, message: "Email test completed successfully" });
    } else {
      res.status(500).json({ success: false, message: "Email test failed" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
>>>>>>> origin/MALONG

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
<<<<<<< HEAD
server.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
=======
// Use server.listen instead of app.listen
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email User: ${process.env.EMAIL_USER ? 'Set' : 'Missing'}`);
  console.log(`🔑 Email Password: ${process.env.EMAIL_PASSWORD ? 'Set' : 'Missing'}`);
  console.log(`🔔 Socket.io server initialized`);
});
>>>>>>> origin/MALONG
