import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

import {
  createCompany,
  setupAccount,
  completeProfile,
  activateCompanyController
} from "../controller/companyController.js";

const router = express.Router();

// SUPER ADMIN → create company
router.post("/create", authMiddleware, allowRoles("SUPER_ADMIN"), createCompany);

// PUBLIC → setup account
router.post("/setup-account", setupAccount);

// OWNER → complete profile
router.put("/complete-profile", authMiddleware, allowRoles("OWNER"), completeProfile);

// OWNER → activate company
router.post("/activate", authMiddleware, allowRoles("OWNER"), activateCompanyController);

export default router;
