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
   WEB VIEWS (FOR MOBILE APP FLOW)
   ======================== */
app.get("/setup-password", (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.send(`<div style="text-align:center; padding:40px; font-family:sans-serif;"><h2 style="color:red;">Error: No token provided</h2></div>`);
  }
  
  res.send(`
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Setup Password</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f3f4f6; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 90%; max-width: 400px; text-align: center; }
          input { width: 100%; padding: 12px; margin: 15px 0; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box; font-size: 16px; outline: none; }
          input:focus { border-color: #10B981; }
          button { width: 100%; padding: 12px; background: #10B981; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 16px; transition: background 0.3s; }
          button:hover { background: #059669; }
          button:disabled { background: #9ca3af; cursor: not-allowed; }
          .error { color: #ef4444; font-size: 14px; margin-top: 10px; }
          .success { color: #10B981; font-size: 24px; margin-top: 10px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card" id="formCard">
          <h2 style="color: #1f2937; margin-top: 0;">Set Up Password</h2>
          <p style="color: #6b7280; font-size: 14px;">Please create a secure password for your new account.</p>
          <input type="password" id="password" placeholder="Enter new password" />
          <button id="submitBtn" onclick="setupPassword()">Save Password</button>
          <div id="message" class="error"></div>
        </div>

        <script>
          async function setupPassword() {
            const password = document.getElementById('password').value;
            const btn = document.getElementById('submitBtn');
            const msg = document.getElementById('message');
            
            if (!password || password.length < 6) {
              msg.textContent = "Password must be at least 6 characters.";
              return;
            }

            btn.disabled = true;
            btn.textContent = "Saving...";
            msg.textContent = "";

            try {
              const res = await fetch('/api/invite/setup-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: "${token}", password: password })
              });
              const data = await res.json();
              
              if (data.success) {
                document.getElementById('formCard').innerHTML = '<div class="success">🎉 Success!</div><p style="color:#6b7280; margin-top:16px;">Your password has been set successfully. You can now open the app and login.</p>';
              } else {
                msg.textContent = data.message || "Failed to set password.";
                btn.disabled = false;
                btn.textContent = "Save Password";
              }
            } catch(e) {
              msg.textContent = "Network error. Please try again.";
              btn.disabled = false;
              btn.textContent = "Save Password";
            }
          }
        </script>
      </body>
    </html>
  `);
});

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