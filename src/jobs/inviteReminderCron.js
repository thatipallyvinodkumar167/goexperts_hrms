import cron from "node-cron";
import prisma from "../config/db.js";
import { sendEmail } from "../utils/sendEmail.js";
import { inviteReminderTemplate } from "../utils/templates/inviteReminderTemplate.js";
import crypto from "crypto";

export const inviteReminderCron = () => {
    // Run every hour
    cron.schedule("0 * * * *", async () => {
        console.log("Running account setup reminder cron...");

        try {
            const now = new Date();
            const tenHoursFromNow = new Date(now.getTime() + 10 * 60 * 60 * 1000);

            // Find invites that:
            // 1. Haven't been accepted
            // 2. Haven't had a reminder sent
            // 3. Expire within the next 10 hours
            // 4. Haven't expired yet
            const pendingInvites = await prisma.companyInvite.findMany({
                where: {
                    acceptedAt: null,
                    reminderSent: false,
                    expiresAt: {
                        lte: tenHoursFromNow,
                        gt: now
                    }
                },
                include: {
                    company: true
                }
            });

            console.log(`Found ${pendingInvites.length} pending invites for reminder.`);

            for (const invite of pendingInvites) {
                try {
                    // We need the raw token to send the link, but we only store the hashed token.
                    // This is a problem. The existing system doesn't store the raw token.
                    // However, we can't reconstruct the raw token from the hash.
                    
                    // Looking at companyService.js, the token is generated and sent once.
                    // To resend a reminder with the SAME token, we would need the raw token.
                    // Since we don't have it, we have two options:
                    // 1. Generate a NEW token and update the record (like resendCompanyInvite does).
                    // 2. The user might have meant to just notify them, but a link is better.
                    
                    // Let's generate a new token for the reminder to be safe and functional.
                    const rawToken = crypto.randomBytes(32).toString("hex");
                    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
                    const inviteLink = `${process.env.FRONTEND_URL}://setup-account?token=${rawToken}`;

                    await prisma.companyInvite.update({
                        where: { id: invite.id },
                        data: {
                            token: hashedToken, // Update with new token
                            reminderSent: true
                        }
                    });

                    await sendEmail(
                        invite.email,
                        "Reminder: Activate Your Company Account",
                        inviteReminderTemplate(invite.company.ownerName || "User", inviteLink)
                    );

                    console.log(`Reminder sent to ${invite.email}`);
                } catch (emailError) {
                    console.error(`Failed to send reminder to ${invite.email}:`, emailError.message);
                }
            }

            console.log("Account setup reminder cron completed.");
        } catch (error) {
            console.error("Invite reminder cron error:", error.message);
        }
    }, {
        timezone: "Asia/Kolkata",
    });

    console.log("Account setup reminder cron scheduled: Every hour (Asia/Kolkata)");
};
