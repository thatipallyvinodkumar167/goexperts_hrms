import express from "express";
import { 
  getAllIndustryTypes, 
  getDesignations,
  getIndustryTypeDetails
} from "../controller/superAdminMasterController.js";
import prisma from "../config/db.js";

const router = express.Router();

// 1. Get all industries
router.get("/industries", getAllIndustryTypes);

// 2. Get departments for an industry
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

export default router;
