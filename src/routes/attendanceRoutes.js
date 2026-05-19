import express from "express";
import { clockIn, clockOut } from "../controller/attendanceController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { companyGuard } from "../middleware/companyGuard.js";

const router = express.Router();

// Binds clock-in & clock-out routes to secure JWT and company verification middlewares
router.post("/clock-in", authMiddleware, companyGuard, clockIn);
router.post("/clock-out", authMiddleware, companyGuard, clockOut);

export default router;
