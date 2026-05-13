import express from "express";
import { 
  getAllIndustryTypes, 
  getDesignations,
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
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import prisma from "../config/db.js";

const router = express.Router();

// ==========================================
// 🔓 PUBLIC ROUTES (For UI Dropdowns)
// ==========================================

// 1. Get all industries
router.get("/industries", getAllIndustryTypes);

// 2. Get specific industry by ID
router.get("/industries/:id", getIndustryTypeDetails);

// 3. Get departments for an industry
router.get("/departments", async (req, res) => {
  try {
    const { industryTypeId } = req.query;
    if (!industryTypeId) throw new Error("industryTypeId is required");
    
    const data = await prisma.departmentTemplate.findMany({
      where: { industryTypeId }
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 3. Get designations (Optional filter: departmentId)
router.get("/designations", getDesignations);

// 4. Get System Policies
router.get("/policies", getSystemPolicies);


// ==========================================
// 🔒 PROTECTED ROUTES (Super Admin Management)
// ==========================================
router.use(authMiddleware, allowRoles("SUPER_ADMIN"));

router.post("/industry/create", createIndustryType);
router.post("/department/add", addDepartmentTemplate);
router.delete("/department/:id", removeDepartmentTemplate);
router.post("/designation/add", addDesignationTemplate);
router.delete("/designation/:id", removeDesignationTemplate);
router.post("/policies/upsert", upsertSystemPolicy);
router.post("/seed-data", seedSystemData);

export default router;
