import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { createCandidate } from "../controller/candidateController.js";

const router = express.Router();

router.post("/create", authMiddleware, allowRoles, createCandidate);

export default router;