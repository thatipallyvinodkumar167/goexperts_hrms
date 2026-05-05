
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { companyGuard } from "../middleware/companyGuard.js";
import { inviteUser, acceptOffer, unifiedSetupPassword } from "../controller/inviteController.js";

const router = express.Router();

router.post("/invite", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, inviteUser);
router.all("/accept-offer", acceptOffer);
router.post("/setup-password", unifiedSetupPassword);

export default router;