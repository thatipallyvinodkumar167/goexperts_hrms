import express from "express";
import { clockIn, clockOut } from "../controller/attendanceController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { companyGuard } from "../middleware/companyGuard.js";
import { uploadAttendanceSelfie } from "../config/multer.js";

const router = express.Router();

// Binds clock-in & clock-out routes supporting both JSON and multipart form-data uploads
router.post("/clock-in", authMiddleware, companyGuard, uploadAttendanceSelfie.single("livePhoto"), clockIn);
router.post("/clock-out", authMiddleware, companyGuard, uploadAttendanceSelfie.single("livePhoto"), clockOut);

export default router;

