
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const userRoutes = require("./userRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// User routes
app.use("/api/users", userRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("Hello from backend!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
