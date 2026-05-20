import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import * as globalLeaveController from "../controller/globalLeaveController.js";

const router = express.Router();

// All global leave routes require SUPER_ADMIN access
router.use(authMiddleware, allowRoles("SUPER_ADMIN"));

router.post("/", globalLeaveController.createGlobalLeaveType);
router.get("/", globalLeaveController.getAllGlobalLeaveTypes);
router.patch("/:id", globalLeaveController.updateGlobalLeaveType);
router.delete("/:id", globalLeaveController.deleteGlobalLeaveType);

export default router;
