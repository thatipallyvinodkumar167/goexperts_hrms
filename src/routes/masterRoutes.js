import express from "express";
import { 
  getAllIndustryTypes, 
  getDesignations,
  getIndustryTypeDetails,
  createIndustryType,
  updateIndustryType,
  deleteIndustryType,
  addDepartmentTemplate,
  removeDepartmentTemplate,
  updateDepartmentTemplate,
  addDesignationTemplate,
  updateDesignationTemplate,
  removeDesignationTemplate,
  upsertSystemPolicy,
  getSystemPolicies,
  seedSystemData
} from "../controller/superAdminMasterController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import prisma from "../config/db.js";
import {
  createCountry,
  getCountries,
  createState,
  getStates,
  createCity,
  getCities,
  updateCountry,
  deleteCountry,
  updateState,
  deleteState,
  updateCity,
  deleteCity
} from "../controller/stateCityController.js";

const router = express.Router();

// ==========================================
// 🔓 PUBLIC ROUTES (For UI Dropdowns)
// ==========================================

// Countries routes
router.post("/countries", createCountry);
router.get("/countries", getCountries);

// States routes
router.post("/states", createState);
router.get("/states", getStates);

// Cities routes
router.post("/cities", createCity);
router.get("/cities", getCities);

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

// 4. Get departments for a SPECIFIC Company (Used by HR)
router.get("/company-departments", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) throw new Error("companyId is required");
    let data = await prisma.department.findMany({
      where: { companyId }
    });

    // Auto-seed if empty (fixes bug for existing companies)
    if (data.length === 0) {
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      if (company) {
        let indId = company.industryTypeId;
        
        // If they still don't have an industry set, force a fallback so they aren't stuck
        if (!indId) {
          const fallbackIndustry = await prisma.industryType.findFirst();
          if (fallbackIndustry) indId = fallbackIndustry.id;
        }

        if (indId) {
          const { seedCompanyMastersFromTemplate } = await import("../services/masterSeedService.js");
          await seedCompanyMastersFromTemplate(companyId, indId);
          
          // Re-fetch after seeding
          data = await prisma.department.findMany({
            where: { companyId }
          });
        }

        // 🚨 ULTIMATE FAILSAFE: If STILL empty (because the industry template itself had no departments)
        if (data.length === 0) {
          await prisma.department.createMany({
            data: [
              { name: "Human Resources", companyId },
              { name: "Engineering", companyId },
              { name: "Sales", companyId },
              { name: "Operations", companyId },
            ]
          });
          data = await prisma.department.findMany({
            where: { companyId }
          });
        }
      }
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 5. Get System Policies
router.get("/policies", getSystemPolicies);


// ==========================================
// 🔒 PROTECTED ROUTES (Super Admin Management)
// ==========================================
router.use(authMiddleware, allowRoles("SUPER_ADMIN"));

router.put("/countries/:id", updateCountry);
router.delete("/countries/:id", deleteCountry);
router.put("/states/:id", updateState);
router.delete("/states/:id", deleteState);
router.put("/cities/:id", updateCity);
router.delete("/cities/:id", deleteCity);

router.post("/industry/create", createIndustryType);
router.put("/industries/:id", updateIndustryType);
router.delete("/industries/:id", deleteIndustryType);
router.post("/department/add", addDepartmentTemplate);
router.put("/department/:id", updateDepartmentTemplate);
router.delete("/department/:id", removeDepartmentTemplate);
router.post("/designation/add", addDesignationTemplate);
router.put("/designation/:id", updateDesignationTemplate);
router.delete("/designation/:id", removeDesignationTemplate);
router.post("/policies/upsert", upsertSystemPolicy);
router.post("/seed-data", seedSystemData);

export default router;
