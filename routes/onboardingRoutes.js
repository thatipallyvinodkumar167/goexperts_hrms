import express from "express";
import { 
    finalizeJoining,
    verifyEmail, 
    updateDocumentStatus,
    getEmployeeReview,
    getAllReviews,
    getSalaryPreview,
    finalizeFullOnboarding
} from "../controller/onboardingController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { uploadEmployeeDocuments } from "../config/multer.js";

const router = express.Router();

// Public onboarding steps
router.post("/verify-email", verifyEmail);


// 🔥 UNIFIED ONBOARDING: ONE API FOR ALL STEPS
router.put(
    "/finish",
    authMiddleware,
    uploadEmployeeDocuments.fields([
        { name: "aadhaar", maxCount: 1 },
        { name: "pan", maxCount: 1 },
        { name: "passport", maxCount: 1 },
        { name: "certificates", maxCount: 1 },
        { name: "experienceLetter", maxCount: 1 },
        { name: "profilePhoto", maxCount: 1 },
        { name: "bankPassbook", maxCount: 1 },
        { name: "signature", maxCount: 1 },
        { name: "education_proof", maxCount: 1 },
        { name: "relieving_letter", maxCount: 1 },
        { name: "payslips", maxCount: 1 },
        { name: "other", maxCount: 1 },
    ]),
    finalizeFullOnboarding
);

// Admin/Owner Approval Step (HR/OWNER Side)
router.get("/all-reviews", authMiddleware, allowRoles("OWNER", "HR"), getAllReviews);
router.get("/review/:employeeId", authMiddleware, allowRoles("OWNER", "HR"), getEmployeeReview);
router.post("/document-status", authMiddleware, allowRoles("OWNER", "HR"), updateDocumentStatus);
router.post("/finalize-joining/:employeeId", authMiddleware, allowRoles("OWNER", "HR"), finalizeJoining);
router.get("/salary-preview/:employeeId", authMiddleware, allowRoles("OWNER", "HR"), getSalaryPreview);

export default router;

