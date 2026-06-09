import cron from "node-cron";
import prisma from "../config/db.js";
import { sendEmail } from "../utils/sendEmail.js";

// ─────────────────────────────────────────────────────────
// CORRECTION REQUEST SLA CRON
// Runs every hour — checks for:
//   1. PENDING requests older than 48 hrs → remind HR + employee
//   2. PENDING requests older than 72 hrs → escalate to OWNER + employee
// ─────────────────────────────────────────────────────────
export const correctionReminderCron = () => {
  cron.schedule(
    "0 * * * *", // Every hour
    async () => {
      console.log("⏰ Running correction request SLA cron...");

      try {
        const now = new Date();
        const cutoff48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        const cutoff72h = new Date(now.getTime() - 72 * 60 * 60 * 1000);

        // Find all PENDING requests that have crossed either threshold
        const pendingRequests = await prisma.correctionRequest.findMany({
          where: {
            status: "PENDING",
            createdAt: { lte: cutoff48h }, // older than 48 hrs
          },
          include: {
            employee: {
              include: {
                user: { select: { name: true, email: true } },
                department: { select: { name: true } },
                designation: { select: { title: true } },
                company: {
                  include: {
                    users: {
                      select: { name: true, email: true, role: true },
                    },
                  },
                },
              },
            },
          },
        });

        console.log(`Found ${pendingRequests.length} overdue correction requests.`);

        for (const request of pendingRequests) {
          const emp = request.employee;
          const empName = `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.user?.name;
          const empEmail = emp.user?.email;
          const empCode = emp.employeeCode;
          const dept = emp.department?.name || "N/A";
          const companyUsers = emp.company?.users || [];
          const hoursElapsed = Math.floor((now - new Date(request.createdAt)) / (1000 * 60 * 60));

          // ── 72-HOUR ESCALATION (owner escalation not yet sent) ──
          if (request.createdAt <= cutoff72h && !request.escalatedToOwnerAt) {
            const ownerUsers = companyUsers.filter((u) => u.role === "OWNER");
            const hrUsers = companyUsers.filter((u) => u.role === "HR");

            const escalationHtml = `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:8px;">
                <h2 style="color:#b71c1c;">🚨 Escalation: Correction Request Unreviewed for ${hoursElapsed} Hours</h2>
                <p>Dear Owner,</p>
                <p>A profile correction request submitted by <strong>${empName} (${empCode})</strong> from <strong>${dept}</strong> department has been <strong>pending for over 72 hours</strong> without any action by HR.</p>

                <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:6px;margin-top:12px;">
                  <tr style="background:#f0f0f0;"><td style="padding:10px;font-weight:bold;">Employee</td><td style="padding:10px;">${empName} (${empCode})</td></tr>
                  <tr><td style="padding:10px;font-weight:bold;">Department</td><td style="padding:10px;">${dept}</td></tr>
                  <tr style="background:#f0f0f0;"><td style="padding:10px;font-weight:bold;">Submitted</td><td style="padding:10px;">${new Date(request.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td></tr>
                  <tr><td style="padding:10px;font-weight:bold;">Hours Elapsed</td><td style="padding:10px;color:#b71c1c;font-weight:bold;">${hoursElapsed} hours</td></tr>
                  <tr style="background:#f0f0f0;"><td style="padding:10px;font-weight:bold;">Reason</td><td style="padding:10px;">${request.reason}</td></tr>
                </table>

                <div style="background:#ffebee;padding:14px;border-radius:6px;border-left:4px solid #b71c1c;margin-top:16px;">
                  <strong>🚨 Action Required:</strong> This request has exceeded the 72-hour SLA. Please review it in the HRMS dashboard immediately or assign it to HR for action.
                </div>

                <p style="margin-top:20px;">Please log in to the HRMS dashboard to approve or reject this request.</p>
                <p>Regards,<br/><strong>HRMS Automated System</strong></p>
              </div>`;

            // Email all OWNERs
            for (const owner of ownerUsers) {
              sendEmail(owner.email, `🚨 Escalation: Pending Correction Request — ${empName} (${hoursElapsed}h overdue)`, escalationHtml).catch(console.error);
            }

            // Also re-remind HR
            for (const hr of hrUsers) {
              sendEmail(
                hr.email,
                `🚨 Escalation Alert: Correction Request from ${empName} Sent to Owner`,
                escalationHtml
              ).catch(console.error);
            }

            // Email employee — escalated
            if (empEmail) {
              const empEscalationHtml = `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:8px;">
                  <h2 style="color:#e65100;">🔔 Update: Your Correction Request Has Been Escalated</h2>
                  <p>Dear <strong>${empName}</strong>,</p>
                  <p>Your profile correction request submitted on <strong>${new Date(request.createdAt).toLocaleDateString("en-IN")}</strong> has been pending for over <strong>72 hours</strong>.</p>
                  <p>We have escalated this to the <strong>Company Owner</strong> for urgent review. You will be notified as soon as a decision is made.</p>
                  <p>If you need urgent assistance, please contact your HR department directly.</p>
                  <p>Regards,<br/><strong>HRMS Automated System</strong></p>
                </div>`;
              sendEmail(empEmail, "🔔 Your Correction Request Has Been Escalated to Owner", empEscalationHtml).catch(console.error);
            }

            // Mark as escalated
            await prisma.correctionRequest.update({
              where: { id: request.id },
              data: { escalatedToOwnerAt: now },
            });

            console.log(`🚨 Escalated correction request ${request.id} (${empName}) to Owner after ${hoursElapsed}h.`);

          // ── 48-HOUR REMINDER (reminder not yet sent) ──
          } else if (!request.reminderSentAt) {
            const hrOwnerUsers = companyUsers.filter(
              (u) => u.role === "HR" || u.role === "OWNER"
            );

            const reminderHtml = `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:8px;">
                <h2 style="color:#e65100;">⚠️ Reminder: Correction Request Awaiting Your Review</h2>
                <p>This is a reminder that a profile correction request from <strong>${empName} (${empCode})</strong> has been pending for <strong>${hoursElapsed} hours</strong> without review.</p>

                <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:6px;margin-top:12px;">
                  <tr style="background:#f0f0f0;"><td style="padding:10px;font-weight:bold;">Employee</td><td style="padding:10px;">${empName} (${empCode})</td></tr>
                  <tr><td style="padding:10px;font-weight:bold;">Department</td><td style="padding:10px;">${dept}</td></tr>
                  <tr style="background:#f0f0f0;"><td style="padding:10px;font-weight:bold;">Submitted</td><td style="padding:10px;">${new Date(request.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td></tr>
                  <tr><td style="padding:10px;font-weight:bold;">Hours Elapsed</td><td style="padding:10px;color:#e65100;font-weight:bold;">${hoursElapsed} hours</td></tr>
                  <tr style="background:#f0f0f0;"><td style="padding:10px;font-weight:bold;">Reason</td><td style="padding:10px;">${request.reason}</td></tr>
                </table>

                <div style="background:#fff3e0;padding:14px;border-radius:6px;border-left:4px solid #ff9800;margin-top:16px;">
                  <strong>⏰ SLA Warning:</strong> If not reviewed within the next 24 hours, this request will be <strong>escalated to the Owner</strong>.
                </div>

                <p style="margin-top:20px;">Please log in to the HRMS dashboard to approve or reject this request.</p>
                <p>Regards,<br/><strong>HRMS Automated System</strong></p>
              </div>`;

            // Email HR/Owner
            for (const hrUser of hrOwnerUsers) {
              sendEmail(hrUser.email, `⚠️ Reminder: Pending Correction Request — ${empName} (${hoursElapsed}h)`, reminderHtml).catch(console.error);
            }

            // Email employee — still pending
            if (empEmail) {
              const empReminderHtml = `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:8px;">
                  <h2 style="color:#1565c0;">🔔 Your Correction Request Is Still Under Review</h2>
                  <p>Dear <strong>${empName}</strong>,</p>
                  <p>Your profile correction request submitted on <strong>${new Date(request.createdAt).toLocaleDateString("en-IN")}</strong> is still being reviewed by HR.</p>
                  <p>We have sent a reminder to HR to take action. You will be notified via email as soon as a decision is made.</p>
                  <p>Thank you for your patience.</p>
                  <p>Regards,<br/><strong>HRMS Automated System</strong></p>
                </div>`;
              sendEmail(empEmail, "🔔 Your Correction Request Is Under Review", empReminderHtml).catch(console.error);
            }

            // Mark reminder as sent
            await prisma.correctionRequest.update({
              where: { id: request.id },
              data: { reminderSentAt: now },
            });

            console.log(`⚠️ Sent 48-hr reminder for correction request ${request.id} (${empName}).`);
          }
        }

        console.log("✅ Correction request SLA cron completed.");
      } catch (error) {
        console.error("❌ Correction reminder cron error:", error.message);
      }
    },
    { timezone: "Asia/Kolkata" }
  );

  console.log("✅ Correction request SLA cron scheduled: Every hour (Asia/Kolkata)");
};
