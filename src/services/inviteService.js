import prisma from "../config/db.js";
import { sendEmail } from "../utils/sendEmail.js";

export const inviteService = async ({ 
    email,
    role,
    companyId,
    isNewHire, // true = new employee(offer),false = existing
    offerData,
    createdById

}) => {

    normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findFirst({
        where : { email: normalizedEmail, companyId}
    });

    if(existingUser){
        throw Error("User  already exists in company ");
    }

    const rawToken = crypto.ramdomBytes(32).toString("hex");

    const expireAt = new Date(Date.now() + 48 * 60 * 1000);

    let invite;

    //hr flow
    if(role === "HR"){

        invite = await prisma.employeeInvite.create({
            data : {
                email : normalizedEmail,
                token : rawToken,
                role : "HR",
                companyId,
                expireAt
            }
        });

        await sendEmail(
            normalizedEmail,
             "HR Invitation",
      `<h3>You are invited as HR</h3>
       <a href="${process.env.FRONTEND_URL}/accept-invite?token=${rawToken}">
       Accept Invite</a>`
        );

    }


    //employee flow
    else  if(role === "EMPLOYEE"){

            // 👉 NEW EMPLOYEE (Offer Letter Flow)
        if(isNewHire){

            if(!offerData){
                throw Error("Offer data required for new hire");
            }

            // create offer letter
            const offer  = await prisma.offerLetter.create({
                data : {
                    employeeEmail : normalizedEmail,
                    companyId,
                    salary : offerData.salary,
                    joiningData : new Date(offerData.joiningData),
                    position : offerData.position,
                    status : "SENT"
                }
            });

            //send offer email
            await sendEmail(
                normalizedEmail,
                   "Offer Letter",
        `<h2>Offer Letter</h2>
         <p>Salary: ${offerData.salary}</p>
         <p>Joining: ${offerData.joiningDate}</p>
         <a href="${process.env.FRONTEND_URL}/accept-offer?email=${normalizedEmail}">
         Accept Offer</a>`
            );

            return {message : "offer letter sent successfully"};

        }

        //existing emp(derect Invite)
        else{
             invite = await prisma.employeeInvite.create({
                data : {
                    email : normalizedEmail,
                    token : rawToken,
                    role : "EMPLOYEE",
                    companyId,
                    expireAt
                }
             });

                await sendEmail(
        normalizedEmail,
        "Employee Invite",
        `<h3>You are invited to company</h3>
         <a href="${process.env.FRONTEND_URL}/accept-invite?token=${rawToken}">
         Join Company</a>`
      );


        }
    }

    //audit log
    await prisma.auditLog.create({
        data : {
            userId : createdById,
            action : "INVITE",
            module : role
        }
    });

    return {message : `${role} invitation sent`, inviteToken : rawToken};

};