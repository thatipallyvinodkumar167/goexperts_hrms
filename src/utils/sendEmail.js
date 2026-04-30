import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, html) => {
    try {
        // SendGrid supports SMTP on Port 2525, which Render does NOT block!
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.sendgrid.net",
            port: Number(process.env.SMTP_PORT) || 2525,
            secure: false, // Port 2525 uses STARTTLS, so secure must be false
            auth: {
                user: process.env.SMTP_USER || "apikey", // SendGrid username is always "apikey"
                pass: process.env.SMTP_PASS // Your actual SendGrid API Key
            }
        });

        // 🚨 MOCK LOGGING (Kept for your convenience) 🚨
        console.log("=============================================");
        console.log(`✉️ PREPARING EMAIL FOR: ${to}`);
        console.log(`📝 SUBJECT: ${subject}`);
        console.log("=============================================");

        const info = await transporter.sendMail({
            from: `"GOExperts HRMS" <${process.env.FROM_EMAIL || "your-verified-sendgrid-email@example.com"}>`,
            to,
            subject,
            html,
            attachments: [
                {
                    filename: "logo.png",
                    path: "./src/utils/templates/logo.png",
                    cid: "companylogo"
                }
            ]
        });

        console.log("Email sent successfully via SendGrid! Message ID:", info.messageId);
    } catch (error) {
        console.error("Email error:", error.message);
        throw new Error("email sending fail");
    }
};
