import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { companyGuard } from "../middleware/companyGuard.js";
import { getAllEmployees, getEmployeeById, getEmployeeByCode, updateEmployee, deleteEmployee, getDeletedEmployeesList, restoreEmployee, updateWorkModel } from "../controller/employeeController.js";
import { 
  getSelf, 
  updateSelf, 
  getBasicProfile, 
  getPersonalProfile, 
  getProfessionalProfile, 
  getFinancialProfile, 
  getDocumentsProfile, 
  getCorrectionsProfile 
} from "../controller/employeeUpdateController.js";
import { uploadProfileImage } from "../config/multer.js";

const router = express.Router();


import {
  createCorrectionRequest,
  listCorrectionRequests,
  getMyCorrectionRequests,
  decideCorrectionRequest,
} from "../controller/correctionController.js";

// ── Self routes (must be BEFORE /:id so Express doesn't treat "self" as an id) ──
//get own profile (Legacy - everything)
router.get("/self/:id", authMiddleware, getSelf);

// ── NEW SPLIT PROFILE APIS ──
router.get("/self/:id/basic", authMiddleware, getBasicProfile);
router.get("/self/:id/personal", authMiddleware, getPersonalProfile);
router.get("/self/:id/professional", authMiddleware, getProfessionalProfile);
router.get("/self/:id/financial", authMiddleware, getFinancialProfile);
router.get("/self/:id/documents", authMiddleware, getDocumentsProfile);
router.get("/self/:id/corrections", authMiddleware, getCorrectionsProfile);
// update own profile (after HR approval + optional profile photo upload)
router.patch("/self/:id", authMiddleware, uploadProfileImage.single("profilePhoto"), updateSelf);
router.put("/self/:id", authMiddleware, uploadProfileImage.single("profilePhoto"), updateSelf);

//get all emps
router.get("/", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, getAllEmployees);

// get employee/HR by employeeCode (must be BEFORE /:id)
router.get("/code/:code", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, getEmployeeByCode);

//get list of soft-deleted accounts
router.get("/deleted-list", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, getDeletedEmployeesList);

//get emp by id
router.get("/:id", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, getEmployeeById);

//update emp
router.put("/:id", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, updateEmployee);

// HR → update employee work model (WFO / WFH / HYBRID)
router.patch("/:id/work-model", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, updateWorkModel);

// ── Employee: raise a correction request ticket ──
router.post(
  "/:id/correction-request",
  authMiddleware,
  companyGuard,
  createCorrectionRequest
);

// ── Employee: view own correction request history ──
router.get(
  "/:id/correction-requests",
  authMiddleware,
  companyGuard,
  getMyCorrectionRequests
);

// ── HR/Owner: list all company correction requests (filter by status) ──
// e.g. GET /api/employee/correction-requests?status=PENDING
router.get(
  "/correction-requests/all",
  authMiddleware,
  companyGuard,
  allowRoles("HR", "OWNER"),
  listCorrectionRequests
);

// ── HR/Owner: approve or reject a request ──
router.patch(
  "/correction-request/:requestId",
  authMiddleware,
  companyGuard,
  allowRoles("HR", "OWNER"),
  decideCorrectionRequest
);

//delete emp
router.delete("/:id", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, deleteEmployee);

//restore soft-deleted emp
router.post("/restore/:id", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, restoreEmployee);



export default router;
