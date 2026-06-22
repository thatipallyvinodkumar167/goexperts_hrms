import express from "express";
import {
  clockIn,
  clockOut,
  submitDailyWork,
  heartbeat,
  getMyAttendanceHistory,
  getCompanyAttendance,
  verifyFlaggedAttendance,
} from "../controller/attendanceController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { companyGuard } from "../middleware/companyGuard.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { uploadAttendanceSelfie } from "../config/multer.js";

const router = express.Router();

// ── Check-In (WFO requires selfie, WFH does not) ──
router.post(
  "/check-in",
  authMiddleware,
  companyGuard,
  uploadAttendanceSelfie.single("livePhoto"),
  clockIn
);

// ── Check-Out (JSON body — no photo needed) ──
router.post("/check-out", authMiddleware, companyGuard, clockOut);

// ── Submit Daily Work (standalone, useful after auto-checkout) ──
router.post("/daily-work", authMiddleware, companyGuard, submitDailyWork);

// ── WFH Heartbeat — sent every 10 mins from Flutter ──
router.post("/heartbeat", authMiddleware, companyGuard, heartbeat);

// ── History ──
router.get("/me", authMiddleware, companyGuard, getMyAttendanceHistory);
router.get("/company", authMiddleware, companyGuard, allowRoles("HR", "OWNER"), getCompanyAttendance);

// ── Verification of Flagged Check-Ins (HR / OWNER) ──
router.post("/verify-flagged", authMiddleware, companyGuard, allowRoles("HR", "OWNER"), verifyFlaggedAttendance);

export default router;
