import prisma from "../config/db";


// ✅ STEP 1 + 2: Accept Invite + Set Password
export const acceptInviteService = async ({token, password, name}) => {
    
    const invite  = await prisma.employeeInvite.findFirst({
        where : {
            token,
            expiresAt : {gt : new Date()},
            acceptedAt : null
        }
    });

    if(!invite){
        throw Error("invalid or expired invite");
    }

    const hashedPassword  = await hashedPassword(password);

     // create user
    const user = await prisma.user.create({
        data : {
            name,
            email : invite.email,
            password : hashedPassword,
            role : invite.role,
            companyId : invite.companyId,
            status : "PENDING_APPROVAL",
            isEmailVerified : false
        }
    });

    //mark invite accepted
    await prisma.employeeInvite.update({

        where : { id : invite.id},
        data : {acceptedAt : new Date()}
    });

    return {message :  "Password set successfully. Please verify email", userId : user.id};

};

//