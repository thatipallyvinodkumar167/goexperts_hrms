import express from "express";
import {
  changePassword,
  forgotPassword,
  getSuperAdminProfile,
  login,
  registerSuperAdmin,
  resetPassword,
  updateProfile,
  deleteAccount,
} from "../controller/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { uploadProfileImage } from "../config/multer.js";
import { authLimiter, passwordResetLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// 🔒 Auth Limiter: max 5 attempts per IP per 15 min (brute-force protection)
router.post("/login", authLimiter, login);
router.post("/register", authLimiter, registerSuperAdmin);

// 🔒 Password Reset Limiter: max 3 per IP per 60 min (email-bomb protection)
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password", passwordResetLimiter, resetPassword);

router.post("/change-password", authMiddleware, changePassword);
router.put("/change-password", authMiddleware, changePassword);

router.delete("/delete-account", authMiddleware, deleteAccount);

router.get("/super-admin/profile", authMiddleware, allowRoles("SUPER_ADMIN"), getSuperAdminProfile);

// Unified update profile (accepts name, email, and profileLogo file)
router.put("/update-profile", authMiddleware, uploadProfileImage.single("profileLogo"), updateProfile);
router.post("/update-profile", authMiddleware, uploadProfileImage.single("profileLogo"), updateProfile);

export default router;
