import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { uploadCompanyDocuments } from "../config/multer.js";

import {
  createCompany,
  setupAccount,
  completeProfile,
  activateCompanyController,
  getAllCompanies,
  resendInvitation,
  updateCompanyProfileController,
  removeCompany,
  uploadCompanyDocumentsController,
  getCompanyProfileController
} from "../controller/companyController.js";

const router = express.Router();

// SUPER ADMIN → list all companies
router.get("/", authMiddleware, allowRoles("SUPER_ADMIN"), getAllCompanies);

// SUPER ADMIN → create company
router.post("/create", authMiddleware, allowRoles("SUPER_ADMIN"), createCompany);

// PUBLIC → setup account (API)
router.post("/setup-account", setupAccount);

// OWNER → complete profile
router.put("/complete-profile", authMiddleware, allowRoles("OWNER"), completeProfile);

// Consolidated Profile Update (Industry Standard)
// - If ID is provided: Only Super Admin can use it to update any company.
// - If ID is NOT provided: User updates their own associated company.
router.put("/profile", authMiddleware, allowRoles("SUPER_ADMIN", "OWNER", "HR"), updateCompanyProfileController);
router.put("/profile/:id", authMiddleware, allowRoles("SUPER_ADMIN"), updateCompanyProfileController);
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


// SUPER ADMIN → approve/activate company
router.post("/activate/:id", authMiddleware, allowRoles("SUPER_ADMIN"), activateCompanyController);

// SUPER ADMIN → resend invitation
router.post("/resend-invite/:id", authMiddleware, allowRoles("SUPER_ADMIN"), resendInvitation);

// SUPER ADMIN → delete company
router.delete("/:id", authMiddleware, allowRoles("SUPER_ADMIN"), removeCompany);


export default router;
