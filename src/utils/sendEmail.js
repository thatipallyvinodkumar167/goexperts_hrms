import nodemailer from "nodemailer";
import dns from "dns";
import { promisify } from "util";

const resolve4 = promisify(dns.resolve4);

export const sendEmail = async (to, subject, html) => {
    try {
        // 1. Manually resolve the hostname to an IPv4 address
        const addresses = await resolve4(process.env.SMTP_HOST);
        const ipv4Host = addresses[0];

        // 2. Pass the raw IPv4 to Nodemailer to entirely bypass IPv6 routing
        const transporter = nodemailer.createTransport({
            host: ipv4Host,
            port: Number(process.env.SMTP_PORT),
            secure: false,
            family: 4,
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                // Ensure TLS validation still works against the original hostname
                servername: process.env.SMTP_HOST
            }
        });

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

        console.log("Email send successfully", info.messageId);
    } catch (error) {
        console.log("Email error", error.message);
        throw Error("email sending fail");
    }
}
