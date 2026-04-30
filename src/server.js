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

// ✅ Serve Android Asset Links for Deep Linking
app.get("/.well-known/assetlinks.json", (req, res) => {
  res.json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.example.goexperts",
       sha256_cert_fingerprints: [
          "2F:89:25:63:17:50:F7:97:98:3E:88:B7:82:6F:34:6D:3C:E0:3C:41:44:20:58:4C:D2:11:67:CC:D1:67:86:7F"
        ]
      }
    }
  ]);
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
