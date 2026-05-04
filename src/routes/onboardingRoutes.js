
import express from "express";
import { acceptInvite, activateUser, completeProfile, verifyEmail, uploadDocuments } from "../controller/onboardingController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { uploadEmployeeDocuments } from "../config/multer.js";

const router = express.Router();

// Public onboarding steps
router.post("/accept-invite", acceptInvite);
router.post("/verify-email", verifyEmail);

// Private onboarding steps
router.post("/complete-profile", authMiddleware, completeProfile);

router.post(
    "/upload-documents",
    authMiddleware,
    uploadEmployeeDocuments.fields([
        { name: "aadhaar", maxCount: 1 },
        { name: "pan", maxCount: 1 },
        { name: "bankPassbook", maxCount: 1 },
        { name: "experienceLetter", maxCount: 1 },
        { name: "other", maxCount: 1 },
    ]),
    uploadDocuments
);

// Admin/Owner Approval Step
router.post("/activate", authMiddleware, allowRoles("OWNER", "HR"), activateUser);

export default router;