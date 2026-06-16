import prisma from "../config/db.js";

/**
 * companyGuard middleware
 * Blocks any protected action if:
 *   1. Company is SUSPENDED (30 days no login)
 *   2. Company is PENDING_APPROVAL (not yet approved by Super Admin)
 *   3. Free trial has expired AND no active paid subscription
 */
export const companyGuard = async (req, res, next) => {
  try {
    // Super Admin bypasses all checks
    if (req.user.role === "SUPER_ADMIN") return next();

    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(403).json({ success: false, message: "No company associated with this account." });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        subscriptions: {
          orderBy: { endDate: "desc" },
          take: 1,
        },
      },
    });

    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found." });
    }

    // ──────────────────────────────────────────────
    // CHECK 1: SUSPENDED
    // ──────────────────────────────────────────────
    if (company.status === "SUSPENDED") {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_SUSPENDED",
        message: "Your account has been suspended due to 30 days of inactivity. Please contact the Super Admin to reactivate your account.",
      });
    }

    // ──────────────────────────────────────────────
    // CHECK 2: PENDING APPROVAL
    // ──────────────────────────────────────────────
    if (company.status === "PENDING_APPROVAL") {
      return res.status(403).json({
        success: false,
        code: "PENDING_APPROVAL",
        message: "Your account is pending approval from the Admin. You will be notified once it is activated.",
      });
    }

    // ──────────────────────────────────────────────
    // CHECK 3: SUBSCRIPTION EXPIRED
    // ──────────────────────────────────────────────
    if (company.status === "ACTIVE") {
      const latestSub = company.subscriptions[0];
      const now = new Date();

      if (!latestSub || latestSub.endDate < now) {
        return res.status(403).json({
          success: false,
          code: "SUBSCRIPTION_EXPIRED",
          message: "Your subscription has expired. Please purchase a plan to continue using the platform.",
        });
      }
    }

    next();
  } catch (error) {
    console.error("❌ companyGuard error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
