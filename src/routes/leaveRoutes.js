import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { companyGuard } from "../middleware/companyGuard.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import * as leaveController from "../controller/leaveController.js";

const router = express.Router();

// All leave routes require auth and company context
router.use(authMiddleware, companyGuard);

// ==========================================
// HR / COMPANY ADMIN ROUTES
// ==========================================
router.post("/types", allowRoles("OWNER", "HR"), leaveController.createLeaveType);
router.get("/types", allowRoles("OWNER", "HR", "EMPLOYEE"), leaveController.getCompanyLeaveTypes);
router.patch("/types/:id", allowRoles("OWNER", "HR"), leaveController.updateLeaveType);
router.delete("/types/:id", allowRoles("OWNER", "HR"), leaveController.deleteLeaveType);

router.get("/company", allowRoles("OWNER", "HR"), leaveController.getCompanyLeaveRequests);
router.patch("/:id/status", allowRoles("OWNER", "HR"), leaveController.updateLeaveStatus);

// ==========================================
// EMPLOYEE ROUTES
// ==========================================
router.get("/balances", allowRoles("OWNER", "HR", "EMPLOYEE"), leaveController.getLeaveBalances);
router.post("/apply", allowRoles("OWNER", "HR", "EMPLOYEE"), leaveController.applyLeave);
router.get("/me", allowRoles("OWNER", "HR", "EMPLOYEE"), leaveController.getMyLeaveHistory);

export default router;
