require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
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
const { sendEmployeeCredentials, testEmail } = require("./emailService"); // Fixed import

const app = express();

// Middleware - CORS and JSON parsing should come FIRST
app.use(cors());
app.use(express.json());

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
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email User: ${process.env.EMAIL_USER ? 'Set' : 'Missing'}`);
  console.log(`🔑 Email Password: ${process.env.EMAIL_PASSWORD ? 'Set' : 'Missing'}`);
});