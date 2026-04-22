import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { createCompany, getAllCompanies } from "../controller/companyController.js";


const router = express.Router();

//only super admin
router.post("/create", authMiddleware, allowRoles("SUPER_ADMIN"), createCompany);

//get all compines
router.get("/", authMiddleware, allowRoles("SUPER_ADMIN"), getAllCompanies);


export default router;
