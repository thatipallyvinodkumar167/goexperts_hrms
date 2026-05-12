import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import {
  getAllIndustryTypes,
  getIndustryTypeDetails,
  createIndustryType,
  addDepartmentTemplate,
  removeDepartmentTemplate,
  addDesignationTemplate,
  removeDesignationTemplate,
  upsertSystemPolicy,
  getSystemPolicies,
  seedSystemData
} from "../controller/superAdminMasterController.js";

const router = express.Router();

// All routes here require SUPER_ADMIN role
router.use(authMiddleware, allowRoles("SUPER_ADMIN"));

// Industry Types
router.get("/industry-types/", getAllIndustryTypes);
router.get("/industry-types/:id", getIndustryTypeDetails);
router.post("/industry-types/create", createIndustryType);

// Department Templates
router.post("/industry-types/department", addDepartmentTemplate);
router.delete("/industry-types/department/:id", removeDepartmentTemplate);

// Designation Templates
router.post("/industry-types/designation", addDesignationTemplate);
router.delete("/industry-types/designation/:id", removeDesignationTemplate);

// System Policies (Terms & Conditions, Privacy)
router.post("/policies", upsertSystemPolicy);
router.get("/policies", getSystemPolicies);
router.post("/seed-data", seedSystemData);

export default router;
