import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import {
  addPlan,
  removePlan,
  getPlans,
  getAdminStatus,
  updatePlan,
  getPlan,
  modifyCompanySubscription
} from "../controller/subscriptionController.js";

const router = express.Router();

// Public/All Auth Users
router.get("/plans", authMiddleware, getPlans);
router.get("/plans/:id", authMiddleware, getPlan);

// Super Admin Only
router.post("/plans", authMiddleware, allowRoles("SUPER_ADMIN"), addPlan);
router.put("/plans/:id", authMiddleware, allowRoles("SUPER_ADMIN"), updatePlan);
router.delete("/plans/:id", authMiddleware, allowRoles("SUPER_ADMIN"), removePlan);
router.get("/status", authMiddleware, allowRoles("SUPER_ADMIN"), getAdminStatus);
router.put("/:id", authMiddleware, allowRoles("SUPER_ADMIN"), modifyCompanySubscription);

export default router;
