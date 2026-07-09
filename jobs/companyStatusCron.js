import cron from "node-cron";
import prisma from "../config/db.js";

export const companyStatusCron = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("🕛 Running Company Status Cron...");

    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Only check ACTIVE companies for suspension
      const activeCompanies = await prisma.company.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          users: {
            select: { role: true, lastLoginAt: true },
          },
        },
      });

      for (const company of activeCompanies) {
        // Check if any OWNER or HR logged in within the last 30 days
        const hasRecentLogin = company.users.some(
          (user) =>
            ["OWNER", "HR"].includes(user.role) &&
            user.lastLoginAt &&
            user.lastLoginAt > thirtyDaysAgo
        );

        if (!hasRecentLogin) {
          await prisma.company.update({
            where: { id: company.id },
            data: { status: "SUSPENDED", inactiveAt: new Date() },
          });
          console.log(`🔴 Suspended (30 days no login): ${company.name}`);
        }
      }

      console.log("✅ Company Status Cron completed.");
    } catch (error) {
      console.error("❌ Cron error:", error.message);
    }
  }, {
    timezone: "Asia/Kolkata",
  });

  console.log("⏰ Company status cron scheduled: Every midnight (Asia/Kolkata)");
};
