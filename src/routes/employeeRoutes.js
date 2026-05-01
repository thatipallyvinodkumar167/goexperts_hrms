import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { companyGuard } from "../middleware/companyGuard.js";
import {createEmployee, getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee } from "../controller/employeeController.js";

const router = express.Router();


//create emp
router.post(
  "/create",
  authMiddleware,
  allowRoles("OWNER", "HR"),
  companyGuard,
  createEmployee
);

//get emp
router.get("/", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, getAllEmployees);

//get emp by id
router.get("/:id", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, getEmployeeById);

//update emp
router.put("/:id", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, updateEmployee);

//delete emp
router.delete("/:id", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, deleteEmployee);



export default router;
