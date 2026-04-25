
import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, html) => {
    // Check for missing environment variables
    const missing = [];
    if (!process.env.SMTP_HOST) missing.push("SMTP_HOST");
    if (!process.env.SMTP_PORT) missing.push("SMTP_PORT");
    if (!process.env.SMTP_USER) missing.push("SMTP_USER");
    if (!process.env.SMTP_PASS) missing.push("SMTP_PASS");

    if (missing.length > 0) {
        console.error(`ERROR: Missing Email Configuration: ${missing.join(", ")}`);
        throw new Error(`Email configuration incomplete: missing ${missing.join(", ")}`);
    }

    try{
        const transporter = nodemailer.createTransport({

            host : process.env.SMTP_HOST,
            port : process.env.SMTP_PORT,
            secure : false,
            
            auth : {
                user : process.env.SMTP_USER,
                pass : process.env.SMTP_PASS
            },

        });

        const info = await transporter.sendMail({

            from : `"GOExperts HRMS" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html
        });

        console.log("Email send successfully", info.messageId);
    } catch(error){
        console.log("Email error", error.message);
        throw Error("email sending fail");
    }
}