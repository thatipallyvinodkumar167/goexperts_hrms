import express from "express";
import { forgotPassword, login, resetPassword } from "../controller/authController.js";

const router = express.Router();

router.post("/login", login);

router.post("/forgot-password", forgotPassword);
router.post("reset-password", resetPassword);

export default router;
