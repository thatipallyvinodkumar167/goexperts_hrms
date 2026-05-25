
import express from "express";
import { createNotification, getCompanyNotifications, markAsRead } from "../controller/notificationController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/send", authMiddleware, allowRoles("SUPER_ADMIN"), createNotification );

router.post("/company", authMiddleware, getCompanyNotifications);


router.put("/read/:id", authMiddleware, markAsRead);

export default router;