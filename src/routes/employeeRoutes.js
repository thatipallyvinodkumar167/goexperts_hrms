import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { companyGuard } from "../middleware/companyGuard.js";
import { getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee } from "../controller/employeeController.js";
import { getSelf, updateSelf } from "../controller/employeeUpdateController.js";
import { uploadProfileImage } from "../config/multer.js";

const router = express.Router();


import {
  createCorrectionRequest,
  listPendingRequests,
  decideCorrectionRequest,
} from "../controller/correctionController.js";

// ── Self routes (must be BEFORE /:id so Express doesn't treat "self" as an id) ──
//get own profile
router.get("/self/:id", authMiddleware, getSelf);
// update own profile (after HR approval + optional profile photo upload)
router.patch("/self/:id", authMiddleware, uploadProfileImage.single("profileLogo"), updateSelf);
router.put("/self/:id", authMiddleware, uploadProfileImage.single("profileLogo"), updateSelf);

//get all emps
router.get("/", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, getAllEmployees);

//get emp by id
router.get("/:id", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, getEmployeeById);

//update emp
router.put("/:id", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, updateEmployee);

// Correction Request flow
router.post(
  "/:id/correction-request",
  authMiddleware,
  createCorrectionRequest
); // employee creates request

router.get(
  "/correction-requests",
  authMiddleware,
  allowRoles("HR", "OWNER"),
  listPendingRequests
); // HR views pending

router.patch(
  "/correction-request/:requestId",
  authMiddleware,
  allowRoles("HR", "OWNER"),
  decideCorrectionRequest
); // HR approves / rejects

//delete emp
router.delete("/:id", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, deleteEmployee);



export default router;
