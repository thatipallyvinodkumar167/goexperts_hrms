import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import {createEmployee, getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee } from "../controller/employeeController.js";

const router = express.Router();


//create emp
router.post(
  "/create",
  authMiddleware,
  allowRoles("OWNER", "HR"),
  createEmployee
);


//get emp
router.get("/", authMiddleware, allowRoles("OWNER", "HR"), getAllEmployees);


//get emp by id
router.get("/:id", authMiddleware, allowRoles("OWNER", "HR"), getEmployeeById);

//update emp
router.put("/:id", authMiddleware, allowRoles("OWNER", "HR"), updateEmployee);

//delete emp 
router.delete("/:id", authMiddleware, allowRoles("OWNER", "HR"), deleteEmployee);



export default router;
