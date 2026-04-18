import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";


const routes = express.Router();

//only super admin
routes.post("/create", authMiddleware, allowRoles("SUPER_ADMIN"), createCompany);


export default routes;