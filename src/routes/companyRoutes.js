import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { createCompany } from "../controller/companyController.js";


const routes = express.Router();

//only super admin
routes.post("/create", authMiddleware, allowRoles("SUPER_ADMIN"), createCompany);


export default routes;
