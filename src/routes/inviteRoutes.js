
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { companyGuard } from "../middleware/companyGuard.js";
import { inviteUser, acceptOffer } from "../controller/inviteController.js";

const router = express.Router();

router.post("/invite", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, inviteUser);
router.all("/accept-offer", acceptOffer);

export default router;