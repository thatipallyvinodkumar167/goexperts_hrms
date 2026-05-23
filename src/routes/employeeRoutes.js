import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { companyGuard } from "../middleware/companyGuard.js";
import { getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee } from "../controller/employeeController.js";
import { updateSelf, updateByAdmin } from "../controllers/employeeUpdateController.js";

const router = express.Router();


//get emp
router.get("/", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, getAllEmployees);

//get emp by id
router.get("/:id", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, getEmployeeById);

//update emp
// Existing update endpoint (admin) remains for full employee updates
router.put("/:id", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, updateEmployee);
// New self‑service endpoint (employee updates limited fields)
router.patch("/self", authMiddleware, updateSelf);
// New admin update endpoint for any employee (full fields) – uses same path but PATCH method
router.patch("/:id", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, updateByAdmin);

//delete emp
router.delete("/:id", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, deleteEmployee);



export default router;
