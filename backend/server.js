require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require('http'); // Add this
const socketIo = require('socket.io'); // Add this
const userRoutes = require("./userRoutes");
const roomRoutes = require("./roomRoutes");
const cartRoutes = require("./cartRoutes");
const contactRoutes = require("./contactRoutes");
const customerRoutes = require("./customerRoutes");
const checkoutRoutes = require("./checkoutRoutes");
const foodRoutes = require("./foodRoutes");
const employeeRoutes = require("./employeeRoutes");
const requestRoutes = require("./requestRoutes");
const taskRoutes = require('./taskRoutes'); 
const attendanceRoutes = require("./attendanceRoutes");
const { sendEmployeeCredentials, testEmail } = require("./emailService"); 
const notificationRoutes = require('./notificationRoutes');

const app = express();

// Middleware - CORS and JSON parsing should come FIRST
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const allowedOrigin = process.env.FRONTEND_URL || 'https://hotel-management-app-s3.vercel.app';
const io = socketIo(server, {
  cors: {
    origin: allowedOrigin,
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

// Routes
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/checkout", checkoutRoutes);
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

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("Hello from backend!");
});

const PORT = process.env.PORT || 5000;
// Use server.listen instead of app.listen
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email User: ${process.env.EMAIL_USER ? 'Set' : 'Missing'}`);
  console.log(`🔑 Email Password: ${process.env.EMAIL_PASSWORD ? 'Set' : 'Missing'}`);
  console.log(`🔔 Socket.io server initialized`);
});