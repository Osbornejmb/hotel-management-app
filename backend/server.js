require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
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
const app = express();

// ========== MIDDLEWARE SETUP ==========
// CORS must come first
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true, // CRITICAL: This allows cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser middleware
app.use(cookieParser());

// Session middleware - UPDATED CONFIG
app.use(session({
  secret: process.env.SESSION_SECRET || 'cP9O6UBtdE1o42C8ZJXswTkKrlD7zvxFnAR5iQqNVGgjypWaY0hfILbeMHumS3',
  resave: true, // Changed to true for better session handling
  saveUninitialized: true, // Changed to true to track sessions
  cookie: {
    secure: false, // Set to false for development (HTTP)
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true, // Prevents client-side JS from reading the cookie
    sameSite: 'lax' // 'lax' for development
  },
  name: 'employee_session'
}));

// ========== ROUTES SETUP ==========
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

// ========== DATABASE CONNECTION ==========
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log(err));

// ========== BASIC ROUTES ==========
app.get("/", (req, res) => {
  res.send("Hello from backend!");
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    sessionId: req.sessionID,
    sessionCount: Object.keys(req.sessionStore.sessions || {}).length
  });
});

// Session debug endpoint
app.get("/api/session-debug", (req, res) => {
  res.json({
    sessionId: req.sessionID,
    sessionData: req.session,
    cookies: req.cookies,
    headers: req.headers
  });
});

// Test session creation endpoint
app.get("/api/session-test-set", (req, res) => {
  req.session.testData = {
    message: "Session is working!",
    timestamp: new Date().toISOString(),
    user: "test-user"
  };
  req.session.save((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to save session" });
    }
    res.json({ 
      message: "Session test data set",
      sessionId: req.sessionID,
      sessionData: req.session
    });
  });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Session configured`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
  console.log(`🔐 Session secure: ${process.env.NODE_ENV === 'production'}`);
});