import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import prisma from "../config/db.js";
import {
  createNotification,
  getCompanyNotifications,
  markCompanyNotificationAsRead,
  sendUserNotification,
  getMyUserNotifications,
  getMyUnreadUserNotifCount,
  markUserNotificationAsRead,
  markAllUserNotificationsAsRead,
  getMySentUserNotifications,
  deleteUserNotification,
  deleteAllMyReceivedNotifications,
  deleteAllMySentNotifications,
  deleteAllNotificationsForCompany
} from "../controller/notificationController.js";

const router = express.Router();

router.use(authMiddleware);

// ============================================================
// FCM TOKEN REGISTRATION
// Mobile/Web app calls this after login to register its token
// ============================================================

// Register / Update FCM token for logged-in user
router.post("/fcm-token", async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return res.status(400).json({ success: false, message: "fcmToken is required" });

    await prisma.user.update({
      where: { id: req.user.id },
      data:  { fcmToken }
    });

    return res.status(200).json({ success: true, message: "FCM token registered successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Unregister (logout / clear) FCM token
router.delete("/fcm-token", async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data:  { fcmToken: null }
    });
    return res.status(200).json({ success: true, message: "FCM token removed" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// SYSTEM / COMPANY NOTIFICATIONS  (SUPER_ADMIN → COMPANY)
// ============================================================
router.post("/system/send", allowRoles("SUPER_ADMIN"), createNotification);
router.get("/system", getCompanyNotifications);
router.put("/system/:id/read", markCompanyNotificationAsRead);

// ============================================================
// USER NOTIFICATIONS — SEND
// SUPER_ADMIN → OWNER
// OWNER       → HR, MANAGER, EMPLOYEE
// HR          → EMPLOYEE
// MANAGER     → HR, EMPLOYEE
// ============================================================
router.post("/user/send", allowRoles("SUPER_ADMIN", "OWNER", "HR", "MANAGER"), sendUserNotification);

// ============================================================
// USER NOTIFICATIONS — VIEW (INBOX)
// ============================================================
router.get("/user", getMyUserNotifications);
router.get("/user/unread-count", getMyUnreadUserNotifCount);
router.get("/user/sent", allowRoles("SUPER_ADMIN", "OWNER", "HR", "MANAGER"), getMySentUserNotifications);

// ============================================================
// USER NOTIFICATIONS — MARK AS READ
// ============================================================
router.put("/user/read-all", markAllUserNotificationsAsRead);
router.put("/user/:id/read", markUserNotificationAsRead);

// ============================================================
// USER NOTIFICATIONS — DELETE  (Role Based)
// SUPER_ADMIN  → any notification
// OWNER/HR/MGR → their sent OR received
// EMPLOYEE     → only received
// ============================================================
router.delete("/user/clear/inbox", deleteAllMyReceivedNotifications);
router.delete("/user/clear/sent",  allowRoles("SUPER_ADMIN", "OWNER", "HR", "MANAGER"), deleteAllMySentNotifications);
router.delete("/company/:companyId/all", allowRoles("SUPER_ADMIN"), deleteAllNotificationsForCompany);
router.delete("/user/:id", deleteUserNotification);   // single delete — keep last (param catch-all)

export default router;