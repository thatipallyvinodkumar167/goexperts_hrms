import { Resend } from "resend";
import fs from "fs";

// Initialize Resend with your API Key from Environment Variables
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to, subject, html, dynamicAttachments = []) => {
    try {
        console.log("=============================================");
        console.log(`✉️ SENDING EMAIL VIA RESEND: ${to}`);
        console.log(`📝 SUBJECT: ${subject}`);
        console.log("=============================================");

        const attachments = [];

        // 1. Add Default Logo (if exists)
        if (fs.existsSync("./src/utils/templates/logo.png")) {
            const logoContent = fs.readFileSync("./src/utils/templates/logo.png");
            attachments.push({
                filename: "logo.png",
                content: logoContent,
            });
        }

        // 2. Add Dynamic Attachments (Offer Letters, etc.)
        for (const att of dynamicAttachments) {
            // Resend expects content as Buffer or string
            const content = fs.readFileSync(att.path);
            attachments.push({
                filename: att.filename,
                content: content,
            });
        }

        const { data, error } = await resend.emails.send({
            from: `GOExperts HRMS <${process.env.FROM_EMAIL || "onboarding@resend.dev"}>`,
            to: [to],
            subject: subject,
            html: html,
            attachments: attachments
        });

        if (error) {
            console.error("❌ RESEND ERROR:", error.message);
            // We do not throw error so the API remains successful
            return;
        }

        console.log("✅ Email sent successfully via Resend! ID:", data.id);
    } catch (error) {
        console.error("⚠️ RESEND CRITICAL ERROR:", error.message);
        // We DO NOT throw error here so the API continues successfully for testing
    }
};
