import prisma from "../config/db.js";
import { hashPassword } from "../utils/hashPassword.js";


// ✅ STEP 1 + 2: Accept Invite + Set Password
export const acceptInviteService = async ({token, password, name}) => {
    
    const invite  = await prisma.employeeInvite.findFirst({
        where : {
            token,
        }
    });

    if(!invite){
        throw Error("Invalid token");
    }

    if(invite.expiresAt < new Date()){
        throw Error("Token has expired");
    }

    if(invite.acceptedAt){
        throw Error("The password has already been set for this account");
    }

    const hashedPassword  = await hashPassword(password);

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

// step 2 verify email
export const verifyEmailService  = async (userId) => {

    const user = await prisma.user.findFirst({
        where : {id : userId}
    });

    if(!user){
        throw Error("user not found")
    }

    await prisma.user.update({
        where : {id : user.id},
        isEmailVerified : true
    });
    return { message : "email verified successfully"}
};

// ✅ STEP 4: Complete Profile

export const completeProfileService  = async ({
    userId,
    personal,
    departmentId,
  designationId
}) => {

    const user = await prisma.user.findUnique({
        where : {id : user.id}
    });

if(!user){
    throw Error("user not found");
}

  // create employee
  const employee = await prisma.employee.create({

    data : {
        userId,
        companyId : user.companyId,
        employeeCode : `EMP-${Date.now()}`,

        departmentId,
        designationId,
        joiningDate : new Date(),
        employmentType : "FRESHER",

        personal : {
            create : personal
        }

    }
  });

  return {message : "profile compaleted", employee};
};

// ✅ STEP 5: Activate Employee
export const activateUserService  = async (userId) => {
    const user = await prisma.user.findUnique({
        where : { id : userId}
    });

    if(!user){
        throw Error("user not found");
    }

    if(!user.isEmailVerified){
        throw Error("Verify email first");
    }

    await prisma.user.update({
        where : {id: userId},
         data: {
      status: "ACTIVE"
    }
    });

    return { message: "Account activated successfully" };
}