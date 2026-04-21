import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import {createEmployee, getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee } from "../controller/employeeController.js";

const router = express.Router();


//create emp
router.post(
  "/create",
  authMiddleware,
  allowRoles("COMPANY_ADMIN", "HR"),
  createEmployee
);


//get emp
router.get("/", authMiddleware, allowRoles("COMPANY_ADMIN", "HR", "MANAGER"), getAllEmployees);


//get emp by id
router.get("/:id", authMiddleware, allowRoles("COMPANY_ADMIN", "HR", "MANAGER"), getEmployeeById);

//update emp
router.put("/:id", authMiddleware, allowRoles("COMPANY_ADMIN", "HR", "MANAGER"), updateEmployee);

//delete emp 
router.delete("/:id", authMiddleware, allowRoles("COMPANY_ADMIN", "HR", "MANAGER"), deleteEmployee);



export default router;
