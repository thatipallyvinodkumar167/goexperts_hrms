import prisma from "../config/db.js";
import { createNotificationService } from "../services/notificationService.js";
import { sendFCMToMultipleTokens } from "../services/fcmService.js";

// ============================================================================
// SYSTEM/COMPANY NOTIFICATIONS (SUPER_ADMIN -> COMPANY)
// ============================================================================

export const createNotification = async (req, res) => {
    try {
        const data = await createNotificationService({
            ...req.body,
            sentById: req.user.id
        });
        res.status(201).json({ success: true, ...data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getCompanyNotifications = async (req, res) => {
    try {
        const data = await prisma.companyNotification.findMany({
            where: { companyId: req.user.companyId },
            include: { notification: true }, // Prisma relation name is lowercase usually, need to check if it's Notification or notification. It's notification in schema
            orderBy: { createdAt: "desc" }
        });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const markCompanyNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.companyNotification.update({
            where: { id },
            data: { isRead: true, readAt: new Date() }
        });
        res.status(200).json({ success: true, message: "Notification marked as read" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// ============================================================================
// USER NOTIFICATIONS (COMPANY->USERS, HR->EMP, MGR->HR/EMP)
// ============================================================================

const ALLOWED_TARGETS = {
  SUPER_ADMIN: ["OWNER"],
  OWNER:       ["HR", "MANAGER", "EMPLOYEE"],
  HR:          ["EMPLOYEE"],
  MANAGER:     ["HR", "EMPLOYEE"],
};

const canSendTo = (senderRole, targetRole) => {
  return ALLOWED_TARGETS[senderRole]?.includes(targetRole) ?? false;
};

export const sendUserNotification = async (req, res) => {
  try {
    const { title, message, type = "INFO", targetRole, targetUserIds, companyId } = req.body;
    const sender = req.user;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: "title and message are required" });
    }
    if (!targetRole && !targetUserIds?.length) {
      return res.status(400).json({ success: false, message: "Provide targetRole or targetUserIds" });
    }
    if (targetRole && !canSendTo(sender.role, targetRole)) {
      return res.status(403).json({
        success: false,
        message: `${sender.role} is not allowed to send notifications to ${targetRole}`
      });
    }

    let recipients = [];

    if (targetUserIds?.length) {
      const users = await prisma.user.findMany({
        where: {
          id: { in: targetUserIds },
          ...(sender.role !== "SUPER_ADMIN" && { companyId: sender.companyId })
        },
        select: { id: true, role: true }
      });

      const unauthorized = users.filter(u => !canSendTo(sender.role, u.role));
      if (unauthorized.length) {
        return res.status(403).json({
          success: false,
          message: `You cannot send to users with role: ${[...new Set(unauthorized.map(u => u.role))].join(", ")}`
        });
      }
      recipients = users.map(u => u.id);
    } else if (targetRole) {
      const scopeCompanyId = sender.role === "SUPER_ADMIN" ? companyId : sender.companyId;
      const users = await prisma.user.findMany({
        where: {
          role: targetRole,
          ...(scopeCompanyId && { companyId: scopeCompanyId }),
          deletedAt: null
        },
        select: { id: true }
      });
      recipients = users.map(u => u.id);
    }

    if (!recipients.length) {
      return res.status(404).json({ success: false, message: "No recipients found for the given criteria" });
    }

    const notifications = await prisma.userNotification.createMany({
      data: recipients.map(recipientId => ({
        title,
        message,
        type,
        senderId:   sender.id,
        senderRole: sender.role,
        recipientId,
        companyId:  sender.companyId ?? companyId ?? null
      }))
    });

    // ── Fire FCM push notifications ─────────────────────────────────────────
    const recipientUsers = await prisma.user.findMany({
      where: { id: { in: recipients }, fcmToken: { not: null } },
      select: { fcmToken: true }
    });

    const fcmTokens = recipientUsers.map(u => u.fcmToken).filter(Boolean);

    let fcmResult = { successCount: 0, failureCount: 0 };
    if (fcmTokens.length) {
      fcmResult = await sendFCMToMultipleTokens({
        tokens: fcmTokens,
        title,
        body: message,
        data: {
          type,
          senderRole: sender.role,
          senderId:   sender.id,
          notificationType: "USER_NOTIFICATION"
        }
      });
    }

    return res.status(201).json({
      success: true,
      message: `Notification sent to ${notifications.count} recipient(s)`,
      sentCount:     notifications.count,
      fcmSentCount:  fcmResult.successCount,
      fcmFailCount:  fcmResult.failureCount
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      recipientId: req.user.id,
      ...(isRead !== undefined && { isRead: isRead === "true" })
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.userNotification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
        include: {
          sender: { select: { id: true, name: true, role: true, profileLogo: true } }
        }
      }),
      prisma.userNotification.count({ where }),
      prisma.userNotification.count({ where: { recipientId: req.user.id, isRead: false } })
    ]);

    return res.status(200).json({
      success: true,
      unreadCount,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      data: notifications
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyUnreadUserNotifCount = async (req, res) => {
  try {
    const count = await prisma.userNotification.count({
      where: { recipientId: req.user.id, isRead: false }
    });
    return res.status(200).json({ success: true, unreadCount: count });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markUserNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await prisma.userNotification.findUnique({ where: { id } });
    if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });
    if (notification.recipientId !== req.user.id) return res.status(403).json({ success: false, message: "Not your notification" });
    if (notification.isRead) return res.status(200).json({ success: true, message: "Already marked as read" });

    await prisma.userNotification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() }
    });

    return res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllUserNotificationsAsRead = async (req, res) => {
  try {
    const result = await prisma.userNotification.updateMany({
      where: { recipientId: req.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });
    return res.status(200).json({
      success: true,
      message: `${result.count} notification(s) marked as read`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMySentUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total] = await Promise.all([
      prisma.userNotification.findMany({
        where: { senderId: req.user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
        include: {
          recipient: { select: { id: true, name: true, role: true } }
        }
      }),
      prisma.userNotification.count({ where: { senderId: req.user.id } })
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      data: notifications
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// DELETE NOTIFICATIONS — Role Based
// ============================================================================

/**
 * DELETE RULES:
 *  SUPER_ADMIN  → can delete ANY notification (any sender, any recipient)
 *  OWNER        → can delete notifications they SENT within their company
 *                 OR notifications they RECEIVED
 *  HR           → can delete notifications they SENT (to EMPLOYEE)
 *                 OR notifications they RECEIVED
 *  MANAGER      → can delete notifications they SENT (to HR/EMPLOYEE)
 *                 OR notifications they RECEIVED
 *  EMPLOYEE     → can only delete notifications they RECEIVED
 */

// 1. Delete a single notification
export const deleteUserNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const notification = await prisma.userNotification.findUnique({ where: { id } });
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    const isRecipient = notification.recipientId === user.id;
    const isSender    = notification.senderId    === user.id;
    const isSuperAdmin = user.role === "SUPER_ADMIN";

    // SUPER_ADMIN can delete anything
    if (isSuperAdmin) {
      await prisma.userNotification.delete({ where: { id } });
      return res.status(200).json({ success: true, message: "Notification deleted by Super Admin" });
    }

    // Recipient can always delete from their inbox
    if (isRecipient) {
      await prisma.userNotification.delete({ where: { id } });
      return res.status(200).json({ success: true, message: "Notification deleted from your inbox" });
    }

    // Sender (OWNER, HR, MANAGER) can delete notifications they sent
    // But only within their company scope
    if (isSender && ["OWNER", "HR", "MANAGER"].includes(user.role)) {
      // Ensure it belongs to same company context
      if (notification.companyId && notification.companyId !== user.companyId) {
        return res.status(403).json({ success: false, message: "You cannot delete notifications outside your company" });
      }
      await prisma.userNotification.delete({ where: { id } });
      return res.status(200).json({ success: true, message: "Sent notification deleted" });
    }

    return res.status(403).json({
      success: false,
      message: "You do not have permission to delete this notification"
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Delete ALL received notifications (inbox clear)
export const deleteAllMyReceivedNotifications = async (req, res) => {
  try {
    const result = await prisma.userNotification.deleteMany({
      where: { recipientId: req.user.id }
    });
    return res.status(200).json({
      success: true,
      message: `${result.count} notification(s) cleared from your inbox`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Delete ALL sent notifications (sender clears their outbox)
//    Only SUPER_ADMIN, OWNER, HR, MANAGER allowed
export const deleteAllMySentNotifications = async (req, res) => {
  try {
    const user = req.user;

    const result = await prisma.userNotification.deleteMany({
      where: {
        senderId: user.id,
        ...(user.role !== "SUPER_ADMIN" && { companyId: user.companyId })
      }
    });

    return res.status(200).json({
      success: true,
      message: `${result.count} sent notification(s) deleted`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. SUPER_ADMIN bulk-deletes ALL notifications for a company
export const deleteAllNotificationsForCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({ success: false, message: "companyId is required" });
    }

    const result = await prisma.userNotification.deleteMany({
      where: { companyId }
    });

    return res.status(200).json({
      success: true,
      message: `${result.count} notification(s) deleted for company`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};