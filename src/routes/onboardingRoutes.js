import express from "express";
import { 
    activateUser, 
    completeProfile, 
    verifyEmail, 
    uploadDocuments,
    addExperience,
    updateDocumentStatus,
    finalBGVApproval,
    assignTerms
} from "../controller/onboardingController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { uploadEmployeeDocuments } from "../config/multer.js";

const router = express.Router();

// Public onboarding steps
router.post("/verify-email", verifyEmail);

// Private onboarding steps (Employee Side)
router.post("/complete-profile", authMiddleware, completeProfile);
router.post("/add-experience", authMiddleware, addExperience);

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

// Admin/Owner Approval Step (HR/OWNER Side)
router.post("/document-status", authMiddleware, allowRoles("OWNER", "HR"), updateDocumentStatus);
router.post("/bgv-decision", authMiddleware, allowRoles("OWNER", "HR"), finalBGVApproval);
router.post("/assign-terms", authMiddleware, allowRoles("OWNER", "HR"), assignTerms);
router.post("/activate", authMiddleware, allowRoles("OWNER", "HR"), activateUser);

export default router;
