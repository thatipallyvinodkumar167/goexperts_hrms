import express from "express";
import { 
    saveBasicInfo,
    saveContactInfo,
    saveEmergencyContact,
    saveEducation,
    addExperience,
    saveSkills,
    uploadDocuments,
    saveBankDetails,
    saveNominee,
    saveComplianceAndFinalize,
    finalizeJoining,
    verifyEmail, 
    updateDocumentStatus,
    getEmployeeReview,
    getAllReviews,
    getSalaryPreview
} from "../controller/onboardingController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { uploadEmployeeDocuments } from "../config/multer.js";

const router = express.Router();

// Public onboarding steps
router.post("/verify-email", verifyEmail);

// Private onboarding steps (Employee Side)
// Step 1: Basic Information
router.post("/basic-info", authMiddleware, saveBasicInfo);

// Step 2: Contact Information
router.post("/contact-info", authMiddleware, saveContactInfo);

// Step 3: Emergency Contact
router.post("/emergency-contact", authMiddleware, saveEmergencyContact);

// Step 4: Education Details
router.post("/education", authMiddleware, saveEducation);

// Step 5: Experience Details
router.post("/experience", authMiddleware, addExperience);

// Step 6: Skills & Certifications
router.post("/skills", authMiddleware, saveSkills);

// Step 7: Document Uploads
router.post(
    "/documents",
    authMiddleware,
    uploadEmployeeDocuments.fields([
        { name: "aadhaar", maxCount: 1 },
        { name: "pan", maxCount: 1 },
        { name: "passport", maxCount: 1 },
        { name: "certificates", maxCount: 1 },
        { name: "experienceLetter", maxCount: 1 },
        { name: "profilePhoto", maxCount: 1 },
        { name: "bankPassbook", maxCount: 1 },
        { name: "cancelledCheque", maxCount: 1 },
        { name: "other", maxCount: 1 },
    ]),
    uploadDocuments
);

// Step 8: Bank Details
router.post("/bank-details", authMiddleware, saveBankDetails);

// Step 9: Nominee Details
router.post("/nominee", authMiddleware, saveNominee);

// Step 10: Compliance & Finalize
router.post("/finalize", authMiddleware, saveComplianceAndFinalize);

// Admin/Owner Approval Step (HR/OWNER Side)
router.get("/all-reviews", authMiddleware, allowRoles("OWNER", "HR"), getAllReviews);
router.get("/review/:employeeId", authMiddleware, allowRoles("OWNER", "HR"), getEmployeeReview);
router.post("/document-status", authMiddleware, allowRoles("OWNER", "HR"), updateDocumentStatus);
router.post("/finalize-joining", authMiddleware, allowRoles("OWNER", "HR"), finalizeJoining);
router.get("/salary-preview/:employeeId", authMiddleware, allowRoles("OWNER", "HR"), getSalaryPreview);

export default router;
