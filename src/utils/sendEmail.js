import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, html) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // 🚨 MOCK FOR RENDER FREE TIER TESTING 🚨
        console.log("=============================================");
        console.log(`✉️ MOCK EMAIL INTERCEPTED FOR: ${to}`);
        console.log(`📝 SUBJECT: ${subject}`);
        console.log(`🔗 CONTENT: ${html}`);
        console.log("=============================================");

        const info = await transporter.sendMail({
            from: `"GOExperts HRMS" <${process.env.SMTP_USER}>`,
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

        console.log("Email sent successfully", info.messageId);
    } catch (error) {
        console.error("Email error:", error.message);
        throw new Error("email sending fail");
    }
};
