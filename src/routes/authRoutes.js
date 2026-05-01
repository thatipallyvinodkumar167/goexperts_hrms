import express from "express";
import { changePassword, forgotPassword, login, resetPassword, updateProfile, uploadProfileLogo } from "../controller/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { uploadProfileImage } from "../config/multer.js";

const router = express.Router();

router.post("/login", login);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.post("/change-password", authMiddleware, changePassword);
router.put("/change-password", authMiddleware, changePassword);

router.put("/update-profile", authMiddleware, updateProfile);
router.post("/update-profile", authMiddleware, updateProfile);

// Upload profile logo as file (multipart/form-data, field name: "profileLogo")
router.post("/upload-profile-logo", authMiddleware, uploadProfileImage.single("profileLogo"), uploadProfileLogo);
router.put("/upload-profile-logo", authMiddleware, uploadProfileImage.single("profileLogo"), uploadProfileLogo);

export default router;
