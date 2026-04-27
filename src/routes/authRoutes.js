import express from "express";
import { changePassword, forgotPassword, login, resetPassword, updateProfile } from "../controller/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.post("/change-password", authMiddleware, changePassword);
router.put("/change-password", authMiddleware, changePassword);

router.put("/update-profile", authMiddleware, updateProfile);

export default router;
