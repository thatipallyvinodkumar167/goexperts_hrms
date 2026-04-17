import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js"; // ✅ import routes

// create express app
const app = express();

// load env variables
dotenv.config();

// middleware to parse JSON
app.use(express.json());

// routes
app.use("/api/auth", authRoutes); // ✅ fixed path

// test route
app.get("/", (req, res) => {
  res.send("Go experts HRMS..");
});

// PORT
const PORT = process.env.PORT || 5002;

// start server
app.listen(PORT, () => {   // ✅ correct method
  console.log(`Server is running on port ${PORT}`);
});