import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { createCompany, deleteCompany, getAllCompanies, getCompanyById, updateCompany } from "../controller/companyController.js";


const router = express.Router();

//only super admin
router.post("/create", authMiddleware, allowRoles("SUPER_ADMIN"), createCompany);

//get all compines
router.get("/", authMiddleware, allowRoles("SUPER_ADMIN"), getAllCompanies);

//get company by id
router.get("/:id", authMiddleware, allowRoles("SUPER_ADMIN"), getCompanyById);

//update company
router.put("/:id", authMiddleware, allowRoles("SUPER_ADMIN"), updateCompany);

//delete company
router.delete("/:id", authMiddleware, allowRoles("SUPER_ADMIN"), deleteCompany);

export default router;
