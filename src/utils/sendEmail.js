
import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, html) => {
 

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