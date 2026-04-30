
import nodemailer from "nodemailer";
import dns from "dns";

// Force Node.js to prefer IPv4 over IPv6 to fix Render ENETUNREACH error
dns.setDefaultResultOrder('ipv4first');

export const sendEmail = async (to, subject, html) => {
 

    try{
        const transporter = nodemailer.createTransport({

            host : process.env.SMTP_HOST,
            port : Number(process.env.SMTP_PORT),
            secure : false,
            family: 4,
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
            
            auth : {
                user : process.env.SMTP_USER,
                pass : process.env.SMTP_PASS
            },

        });

        const info = await transporter.sendMail({
            from : `"GOExperts HRMS" <${process.env.SMTP_USER}>`,
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
    } catch(error){
        console.log("Email error", error.message);
        throw Error("email sending fail");
    }
}
