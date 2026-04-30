
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { inviteUser } from "../controller/inviteController.js";

const router = express.Router();

router.post("/invite", authMiddleware, allowRoles, inviteUser);

export default router;