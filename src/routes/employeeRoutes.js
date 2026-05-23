import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { companyGuard } from "../middleware/companyGuard.js";
import { getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee } from "../controller/employeeController.js";
import { updateSelf } from "../controllers/employeeUpdateController.js";
import { uploadProfileImage } from "../config/multer.js";

const router = express.Router();


//get emp
router.get("/", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, getAllEmployees);

//get emp by id
router.get("/:id", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, getEmployeeById);

//update emp
// Existing update endpoint (admin) remains for full employee updates
router.put("/:id", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, updateEmployee);
// New self‑service endpoint (employee updates limited fields + profile photo)
router.patch("/self", authMiddleware, uploadProfileImage.single("profileLogo"), updateSelf);

//delete emp
router.delete("/:id", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, deleteEmployee);



export default router;
