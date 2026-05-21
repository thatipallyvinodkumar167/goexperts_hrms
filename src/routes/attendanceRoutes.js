import express from "express";
import { clockIn, clockOut, getMyAttendanceHistory, getCompanyAttendance } from "../controller/attendanceController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { companyGuard } from "../middleware/companyGuard.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { uploadAttendanceSelfie } from "../config/multer.js";

const router = express.Router();

// Binds clock-in & clock-out routes supporting both JSON and multipart form-data uploads
router.post("/clock-in", authMiddleware, companyGuard, uploadAttendanceSelfie.single("livePhoto"), clockIn);
router.post("/clock-out", authMiddleware, companyGuard, uploadAttendanceSelfie.single("livePhoto"), clockOut);

// History routes
router.get("/me", authMiddleware, companyGuard, getMyAttendanceHistory);
router.get("/company", authMiddleware, companyGuard, allowRoles("HR", "OWNER"), getCompanyAttendance);

export default router;

