import dotenv from "dotenv";
dotenv.config();

import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js"
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import logger from "./middleware/loggerMiddleware.js";
import { companyStatusCron } from "./jobs/companyStatusCron.js";
import { inviteReminderCron } from "./jobs/inviteReminderCron.js";
import inviteRoutes from "./routes/inviteRoutes.js";
// import { ensureSuperAdmin } from "./bootstrap/ensureSuperAdmin.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

//loggers

app.use(morgan("dev"));
app.use(logger);

//routes
app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/invite", inviteRoutes);

//checking health
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy 🚀",
    uptime: process.uptime()
  });
});

app.get("/", (req, res) => {
  res.send("Go experts HRMS..");
});

const PORT = process.env.PORT || 5002;


// ❌ GLOBAL ERROR HANDLER
/////////////////////////////

app.use((err, req, res, next) => {
  console.error("🔥 Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});


const startServer = async () => {
  try {
    // await ensureSuperAdmin();
    // console.log("Default super admin ensured: goexperts@admin");


    companyStatusCron();
    inviteReminderCron();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT} (0.0.0.0)`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
