
import express from "express";
import { acceptInvite, activateUser, completeProfile, verifyEmail } from "../controller/onboardingController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/accept-invite", acceptInvite);
router.post("/verify-email", verifyEmail);

router.post("/complete-profile", authMiddleware, completeProfile);
router.post("/activate", activateUser);

export default router;