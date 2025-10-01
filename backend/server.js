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
const taskRoutes = require('./taskRoutes'); // Fixed path
const app = express();

// Middleware - CORS and JSON parsing should come FIRST
app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/contact", contactRoutes);
// app.use("/api/reservations", reservationRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use('/api/employee', employeeRoutes);
app.use("/api/requests", requestRoutes);
// Routes
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/tasks", taskRoutes); // Task routes

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("Hello from backend!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
