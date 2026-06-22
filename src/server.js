import dotenv from "dotenv";
dotenv.config();

import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import authRoutes from "./routes/authRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import inviteRoutes from "./routes/inviteRoutes.js";
import onboardingRoutes from "./routes/onboardingRoutes.js";
import masterRoutes from "./routes/masterRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import globalLeaveRoutes from "./routes/globalLeaveRoutes.js";

import logger from "./middleware/loggerMiddleware.js";
import { companyStatusCron } from "./jobs/companyStatusCron.js";
import { inviteReminderCron } from "./jobs/inviteReminderCron.js";
import { startMidnightAttendanceCron } from "./jobs/midnightAttendanceCron.js";
import { startHybridQuotaCron } from "./jobs/hybridQuotaCron.js";
import { correctionReminderCron } from "./jobs/correctionReminderCron.js";
import { subscriptionReminderCron } from "./jobs/subscriptionReminderCron.js";
import { loadFaceApiModels } from "./config/faceApi.js";
import { initSocket } from "./socket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

/* ========================
   TRUST PROXY (IMPORTANT)
   ======================== */
app.set("trust proxy", 1);

/* ========================
   SECURITY MIDDLEWARE
   ======================== */
app.use(helmet());

app.use(
  cors({
    origin: "*", // 🔥 change to your frontend domain in production
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ========================
   LOGGING
   ======================== */
app.use(morgan("dev"));
app.use(logger);

/* ========================
   HEALTH CHECK (FIRST ROUTE)
   ======================== */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy 🚀",
    uptime: process.uptime(),
  });
});

/* ========================
   ROOT ROUTE
   ======================== */
app.get("/", (req, res) => {
  res.send("Go Experts HRMS API Running 🚀");
});

/* ========================
   DEEP LINK REDIRECT (FLUTTER)
   ======================== */
app.get("/setup-password", (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).send("Invalid setup link. Token missing.");
  }

  // This HTML attempts to auto-open the Flutter app via custom URL scheme.
  // We use "goexpertshrms://" as the custom scheme.
  res.send(`
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Setup Password</title>
        <script>
          window.onload = function() {
            // Attempt to auto-redirect to the Flutter app
            window.location.href = "goexpertshrms://setup-password?token=${token}";
          };
        </script>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; padding: 40px; background-color: #f3f4f6; margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
          .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 400px; width: 100%; }
          .btn { display: inline-block; background: #4F46E5; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; margin-top: 24px; font-weight: bold; font-size: 16px; transition: background 0.2s; }
          .btn:hover { background: #4338CA; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2 style="color: #1f2937; margin-top: 0;">Opening App...</h2>
          <p style="color: #4b5563; line-height: 1.5;">You are being redirected to the GoExperts HRMS app to set up your password.</p>
          <p style="color: #9ca3af; font-size: 14px; margin-top: 20px;">If the app does not open automatically, please tap the button below.</p>
          <a href="goexpertshrms://setup-password?token=${token}" class="btn">Open App to Setup Password</a>
        </div>
      </body>
    </html>
  `);
});

/* ========================
   STATIC FILES
   ======================== */
app.use("/uploads", express.static(join(__dirname, "../uploads")));

/* ========================
   API ROUTES
   ======================== */
app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/invite", inviteRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/master", masterRoutes);
app.use("/api/master/leaves", globalLeaveRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);

/* ========================
   FAVICON IGNORE
   ======================== */
app.get("/favicon.ico", (req, res) => res.status(204).end());

/* ========================
   ANDROID ASSET LINKS
   ======================== */
app.get("/.well-known/assetlinks.json", (req, res) => {
  res.json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.example.goexperts",
        sha256_cert_fingerprints: [
          "2F:89:25:63:17:50:F7:97:98:3E:88:B7:82:6F:34:6D:3C:E0:3C:41:44:20:58:4C:D2:11:67:CC:D1:67:86:7F",
        ],
      },
    },
  ]);
});

/* ========================
   ERROR HANDLER (LAST)
   ======================== */
app.use((err, req, res, next) => {
  console.error("🔥 Global Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

/* ========================
   START SERVER
   ======================== */
const PORT = process.env.PORT || 5002;

const startServer = async () => {
  try {
    await loadFaceApiModels();

    companyStatusCron();
    inviteReminderCron();
    startMidnightAttendanceCron();
    startHybridQuotaCron();
    correctionReminderCron();
    subscriptionReminderCron();

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    initSocket(server);
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
};

startServer();