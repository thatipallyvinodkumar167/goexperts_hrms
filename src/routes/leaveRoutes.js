import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { companyGuard } from "../middleware/companyGuard.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import * as leaveController from "../controller/leaveController.js";

const router = express.Router();

// All leave routes require auth and company context
router.use(authMiddleware, companyGuard);

// ==========================================
// HR / ADMIN ROUTES
// ==========================================
router.post("/types", allowRoles("OWNER", "HR", "SUPER_ADMIN"), leaveController.createLeaveType);
router.get("/types", leaveController.getCompanyLeaveTypes);
router.patch("/types/:id", allowRoles("OWNER", "HR", "SUPER_ADMIN"), leaveController.updateLeaveType);

router.get("/company", allowRoles("OWNER", "HR", "SUPER_ADMIN"), leaveController.getCompanyLeaveRequests);
router.patch("/:id/status", allowRoles("OWNER", "HR", "SUPER_ADMIN"), leaveController.updateLeaveStatus);

// ==========================================
// EMPLOYEE ROUTES
// ==========================================
router.get("/balances", leaveController.getLeaveBalances);
router.post("/apply", leaveController.applyLeave);
router.get("/me", leaveController.getMyLeaveHistory);

export default router;
