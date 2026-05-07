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
  removeDesignationTemplate
} from "../controller/superAdminMasterController.js";

const router = express.Router();

// All routes here require SUPER_ADMIN role
router.use(authMiddleware, allowRoles("SUPER_ADMIN"));

// Industry Types
router.get("/industry-types", getAllIndustryTypes);
router.get("/industry-types/:id", getIndustryTypeDetails);
router.post("/industry-types", createIndustryType);

// Department Templates
router.post("/templates/department", addDepartmentTemplate);
router.delete("/templates/department/:id", removeDepartmentTemplate);

// Designation Templates
router.post("/templates/designation", addDesignationTemplate);
router.delete("/templates/designation/:id", removeDesignationTemplate);

export default router;
