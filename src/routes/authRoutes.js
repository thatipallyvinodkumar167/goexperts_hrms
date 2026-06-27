import express from "express";
import {
  changePassword,
  forgotPassword,
  login,
  registerSuperAdmin,
  resetPassword,
  updateProfile,
} from "../controller/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { uploadProfileImage } from "../config/multer.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", registerSuperAdmin);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.post("/change-password", authMiddleware, changePassword);
router.put("/change-password", authMiddleware, changePassword);

// Unified update profile (accepts name, email, and profileLogo file)
router.put("/update-profile", authMiddleware, uploadProfileImage.single("profileLogo"), updateProfile);
router.post("/update-profile", authMiddleware, uploadProfileImage.single("profileLogo"), updateProfile);

export default router;
