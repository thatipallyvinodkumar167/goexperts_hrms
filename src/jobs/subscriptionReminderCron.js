import cron from "node-cron";
import prisma from "../config/db.js";
import { sendEmail } from "../utils/sendEmail.js";
import { subscriptionReminderTemplate } from "../utils/templates/subscriptionReminderTemplate.js";

export const subscriptionReminderCron = () => {
  cron.schedule("0 8 * * *", async () => {
    console.log("🕛 Running Subscription Reminder Cron...");

    try {
      // Find companies that have active subscriptions
      const activeCompanies = await prisma.company.findMany({
        where: { status: "ACTIVE" },
        include: {
          subscriptions: {
            where: {
              endDate: { gte: new Date() } // active or future
            },
            include: { plan: true },
            orderBy: { endDate: "desc" },
            take: 1
          }
        }
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const company of activeCompanies) {
        if (company.subscriptions && company.subscriptions.length > 0) {
          const sub = company.subscriptions[0];
          const endDate = new Date(sub.endDate);
          endDate.setHours(0, 0, 0, 0);

          // Calculate difference in days
          const diffTime = endDate.getTime() - today.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

          // Only send reminder if days remaining is 1, 2, or 3
          if (diffDays === 3 || diffDays === 2 || diffDays === 1) {
            const ownerEmail = company.ownerEmail || company.email;
            const expirationDateString = new Date(sub.endDate).toLocaleDateString();

            const htmlContent = subscriptionReminderTemplate(
              company.ownerName,
              company.name,
              sub.plan.name,
              diffDays,
              expirationDateString
            );

            await sendEmail(
              ownerEmail,
              `Action Required: Your Subscription Expires in ${diffDays} Days!`,
              htmlContent
            );

            console.log(`✅ Sent subscription reminder (${diffDays} days left) to ${company.name} (${ownerEmail})`);
          }
        }
      }

      console.log("✅ Subscription Reminder Cron completed.");
    } catch (error) {
      console.error("❌ Subscription Reminder Cron error:", error.message);
    }
  }, {
    timezone: "Asia/Kolkata",
  });

  console.log("⏰ Subscription reminder cron scheduled: Every day at 08:00 AM (Asia/Kolkata)");
};
