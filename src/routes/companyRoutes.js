import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { uploadCompanyDocuments, uploadCompanyLogo } from "../config/multer.js";

import {
  createCompany,
  activateCompanyController,
  getAllCompanies,
  resendInvitation,
  updateCompanyProfileController,
  removeCompany,
  restoreCompany,
  uploadCompanyDocumentsController,
  getCompanyProfileController,
  uploadCompanyLogoController,
  updateBasicSettingsController,
  updateHrSettingsController,
  updatePayrollSettingsController,
  updateComplianceSettingsController,
  getSoftDeletedCompaniesController,
  getPendingApprovalCompaniesController
} from "../controller/companyController.js";
import { getCompanyDashboard } from "../controller/companyDashboardController.js";
import { companyGuard } from "../middleware/companyGuard.js";
const router = express.Router();

// SUPER ADMIN → list all companies
router.get("/", authMiddleware, allowRoles("SUPER_ADMIN"), getAllCompanies);

// SUPER ADMIN → list soft-deleted companies
router.get("/soft-deleted", authMiddleware, allowRoles("SUPER_ADMIN"), getSoftDeletedCompaniesController);

// SUPER ADMIN → list companies pending onboarding approval
router.get("/pending-approval", authMiddleware, allowRoles("SUPER_ADMIN"), getPendingApprovalCompaniesController);

// OWNER/HR → upload logo
router.post("/logo", authMiddleware, allowRoles("OWNER", "HR"), uploadCompanyLogo.single("logo"), uploadCompanyLogoController);

router.post("/create", authMiddleware, allowRoles("SUPER_ADMIN"), createCompany);

// OWNER/HR/EMPLOYEE → Dashboard stats (token-based, returns role-specific data)
router.get("/dashboard", authMiddleware, allowRoles("OWNER", "HR", "EMPLOYEE"), companyGuard, getCompanyDashboard);

// Consolidated Profile Update (Industry Standard)
// - If ID is provided: Only Super Admin can use it to update any company.
// - If ID is NOT provided: User updates their own associated company.
router.put(
  "/profile",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "OWNER", "HR"),
  uploadCompanyDocuments.fields([
    { name: "logo", maxCount: 1 },
    { name: "signature", maxCount: 1 },
    { name: "regCertificate", maxCount: 1 },
    { name: "gstProof", maxCount: 1 },
    { name: "panProof", maxCount: 1 },
    { name: "tanProof", maxCount: 1 },
  ]),
  updateCompanyProfileController
);
router.put(
  "/profile/:id",
  authMiddleware,
  allowRoles("SUPER_ADMIN"),
  uploadCompanyDocuments.fields([
    { name: "logo", maxCount: 1 },
    { name: "signature", maxCount: 1 },
    { name: "regCertificate", maxCount: 1 },
    { name: "gstProof", maxCount: 1 },
    { name: "panProof", maxCount: 1 },
    { name: "tanProof", maxCount: 1 },
  ]),
  updateCompanyProfileController
);
router.get("/profile", authMiddleware, allowRoles("SUPER_ADMIN", "OWNER", "HR"), getCompanyProfileController);
router.get("/profile/:id", authMiddleware, allowRoles("SUPER_ADMIN"), getCompanyProfileController);
router.post(
  "/profile/upload-documents",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "OWNER", "HR"),
  uploadCompanyDocuments.fields([
    { name: "gstProof", maxCount: 1 },
    { name: "panProof", maxCount: 1 },
    { name: "tanProof", maxCount: 1 },
  ]),
  uploadCompanyDocumentsController
);
router.post(
  "/profile/:id/upload-documents",
  authMiddleware,
  allowRoles("SUPER_ADMIN"),
  uploadCompanyDocuments.fields([
    { name: "gstProof", maxCount: 1 },
    { name: "panProof", maxCount: 1 },
    { name: "tanProof", maxCount: 1 },
  ]),
  uploadCompanyDocumentsController
);

// ──────────────────────────────────────────────
// CATEGORY-WISE SETTINGS (Post-Onboarding)
// ──────────────────────────────────────────────
router.put(
  "/settings/basic",
  authMiddleware,
  allowRoles("OWNER", "HR"),
  uploadCompanyLogo.single("logo"),
  updateBasicSettingsController
);

router.put(
  "/settings/hr",
  authMiddleware,
  allowRoles("OWNER", "HR"),
  updateHrSettingsController
);

router.put(
  "/settings/payroll",
  authMiddleware,
  allowRoles("OWNER", "HR"),
  updatePayrollSettingsController
);

router.put(
  "/settings/compliance",
  authMiddleware,
  allowRoles("OWNER", "HR"),
  updateComplianceSettingsController
);


// SUPER ADMIN → approve/activate company
router.post("/activate/:id", authMiddleware, allowRoles("SUPER_ADMIN"), activateCompanyController);

// SUPER ADMIN → resend invitation
router.post("/resend-invite/:id", authMiddleware, allowRoles("SUPER_ADMIN"), resendInvitation);

// SUPER ADMIN → delete company
router.delete("/:id", authMiddleware, allowRoles("SUPER_ADMIN"), removeCompany);

// SUPER ADMIN → restore company
router.patch("/restore/:id", authMiddleware, allowRoles("SUPER_ADMIN"), restoreCompany);


export default router;
