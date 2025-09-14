
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const userRoutes = require("./userRoutes");
const roomRoutes = require("./roomRoutes");
const cartRoutes = require("./cartRoutes");
const contactRoutes = require("./contactRoutes");
const reservationRoutes = require("./reservationRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// User routes

// User routes

app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);


app.use("/api/cart", cartRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/reservations", reservationRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("Hello from backend!");
});
require("dotenv").config();

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
