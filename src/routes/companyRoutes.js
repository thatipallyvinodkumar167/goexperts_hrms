import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

import {
  createCompany,
  setupAccount,
  completeProfile,
  activateCompanyController,
  getAllCompanies,
  resendInvitation,
  updateCompanyProfileController
} from "../controller/companyController.js";

const router = express.Router();

// SUPER ADMIN → list all companies
router.get("/", authMiddleware, allowRoles("SUPER_ADMIN"), getAllCompanies);

// SUPER ADMIN → create company
router.post("/create", authMiddleware, allowRoles("SUPER_ADMIN"), createCompany);

// PUBLIC → setup account
router.post("/setup-account", setupAccount);

// OWNER → complete profile
router.put("/complete-profile", authMiddleware, allowRoles("OWNER"), completeProfile);

// Consolidated Profile Update (Industry Standard)
// - If ID is provided: Only Super Admin can use it to update any company.
// - If ID is NOT provided: User updates their own associated company.
router.put("/profile/:id?", authMiddleware, allowRoles("SUPER_ADMIN", "OWNER", "HR"), updateCompanyProfileController);

// SUPER ADMIN → approve/activate company
router.post("/activate/:id", authMiddleware, allowRoles("SUPER_ADMIN"), activateCompanyController);

// SUPER ADMIN → resend invitation
router.post("/resend-invite/:id", authMiddleware, allowRoles("SUPER_ADMIN"), resendInvitation);


export default router;
