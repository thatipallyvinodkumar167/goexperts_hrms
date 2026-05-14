import nodemailer from "nodemailer";
import fs from "fs";

export const sendEmail = async (to, subject, html, dynamicAttachments = []) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.sendgrid.net",
            port: Number(process.env.SMTP_PORT) || 2525,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER || "apikey",
                pass: process.env.SMTP_PASS
            }
        });

        console.log("=============================================");
        console.log(`✉️ PREPARING EMAIL FOR: ${to}`);
        console.log(`📝 SUBJECT: ${subject}`);
        console.log("=============================================");

        const defaultAttachments = [];
        // Only add logo if it exists (prevents crash on Render if file missing)
        if (fs.existsSync("./src/utils/templates/logo.png")) {
            defaultAttachments.push({
                filename: "logo.png",
                path: "./src/utils/templates/logo.png",
                cid: "companylogo"
            });
        }

        const info = await transporter.sendMail({
            from: `"GOExperts HRMS" <${process.env.FROM_EMAIL || "superhealthmanagement@gmail.com"}>`,
            to,
            subject,
            html,
            attachments: [...defaultAttachments, ...dynamicAttachments]
        });

        console.log("✅ Email sent successfully via SendGrid! Message ID:", info.messageId);
    } catch (error) {
        console.error("⚠️ OFFER EMAIL FAILED (Limit Reached?):", error.message);
        // We DO NOT throw error here so the API continues successfully for testing
    }
};
