
import nodemailer from "nodemailer";

export const sendEmail = async (toString, subject, html) => {

    try{
        const transporter = nodemailer.createTransport({

            host : process.env.SMTP_HOST,
            port : process.env.SMPT_PORT,
            secure : false,
            
            auth : {
                user : process.env.SMPT_USER,
                pass : process.env.SMPT_PASS
            },

        });

        const info = await transporter.sendMail({

            from : `"GOExperts HRMS" <${process.env.SMPT_USER}>`,
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