import prisma from "../config/db.js";
import crypto from "crypto";
import { generateToken } from "../utils/generateToken.js";
import { comparePassword, hashPassword } from "../utils/hashPassword.js";
import { resetPasswordTemplate } from "../utils/templates/resetPasswordTemplate.js";
import { sendEmail } from "../utils/sendEmail.js"; 


//login user service
export const loginUser = async ({ email, password } = {}) => {
  if (!email || !password) {
    throw new Error("email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Super admin login path (no company context)
  const superAdmin = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      companyId: null,
      role: "SUPER_ADMIN",
    },
  });

  if (superAdmin) {
    const isMatch = await comparePassword(password, superAdmin.password);
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }


    await prisma.user.update({
      where : { id : superAdmin.id},
      data : {lastLoginAt : new Date() }

    });

    return {
      user: {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        profileLogo: superAdmin.profileLogo,
        isFullRegistered: true,
      },
      token: generateToken(superAdmin),
    };
  }

  // Company user login path
  let users = await prisma.user.findMany({
    where: { 
      email: normalizedEmail, 
      status: { in: ["ACTIVE", "PENDING_APPROVAL"] } 
    },
    include: { company: true, employee: true }
  });

  // If no user found by direct email, check if they typed the Company Email instead
  if (users.length === 0) {
    const companyByEmail = await prisma.company.findFirst({
      where: { email: normalizedEmail } 
    });

    if (companyByEmail) {
      // Find the OWNER of this company
      const owner = await prisma.user.findFirst({
        where: { 
          companyId: companyByEmail.id, 
          role: "OWNER", 
          status: { in: ["ACTIVE", "PENDING_APPROVAL"] } 
        },
        include: { company: true }
      });
      if (owner) {
        users = [owner];
      }
    }
  }

  if (users.length === 0) {
    throw new Error("User not found or inactive");
  }

  // Allow login even if company is not ACTIVE yet
  const user = users[0];

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }


    // ⭐ CHANGE 3 → UPDATE LAST LOGIN
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const responseUser = {
    id: user.id, // User Account ID (consistent for all accounts)
    name: user.name,
    email: user.email,
    role: user.role,
    // 💡 SMART FALLBACK: If OWNER has no personal logo, use the Company Logo!
    profileLogo: user.profileLogo || (user.role === "OWNER" ? user.company?.companyLogo : null),
    companyId: user.companyId,
    // Pass these to the frontend so it knows which screen to show!
    isProfileCompleted: user.company ? user.company.isProfileCompleted : false, 
    companyStatus: user.company ? user.company.status : "INCOMPLETE",
    isFullRegistered: user.role === "OWNER" 
      ? (user.company ? user.company.isProfileCompleted : false)
      : false, // Default false, will be overridden below for HR/Employee
    industryTypeId: user.company ? user.company.industryTypeId : null
  };

  // Only include employee onboarding fields if the user is an employee or HR
  if (user.role === "EMPLOYEE" || user.role === "HR") {
    responseUser.id = user.employee ? user.employee.userId : null; // Set Employee userId as the 'id' key
    responseUser.onboardingCompleted = user.employee ? user.employee.onboardingCompleted : false;
    responseUser.isFullRegistered = user.employee ? user.employee.onboardingCompleted : false;
  }

  return {
    user: responseUser,
    token: generateToken(user),
  };
};



//forgot password service

export const forgotPasswordService = async (email) => {

  const normalizedEmail = email.trim().toLowerCase();

  //checking mail
  const user = await prisma.user.findFirst({
    where : {
      email : normalizedEmail,
      status :"ACTIVE"
    }
  });

if(!user){
  throw Error("User not found");
}

//generate random token 
const rawToken = crypto.randomBytes(32).toString("hex");

//hash token
const hashToken = crypto.createHash("sha256").update(rawToken).digest("hex");

//delete old token
await prisma.passwordResetToken.deleteMany({where : {userId : user.id}});

//store token
  await prisma.passwordResetToken.create({
    data : {
      token : hashToken,
      userId : user.id,
      expiresAt : new Date(Date.now() + 15 * 60 * 1000) // ⭐ FIXED spelling
    }
  });

//reset link 
const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

//send email
await sendEmail(
  user.email,
  "Reset Your Password",
  resetPasswordTemplate(user.email,resetLink)
);

return {message : "Reset link sent to email"};

};



//reset password service
export const resetPasswordService = async (token, newPassword) => {

  //hash incomming token 
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");


  const resetToken = await prisma.passwordResetToken.findFirst({
    where : {
      token : hashedToken,
      expiresAt : { gt : new Date() }
    }
  });

if(!resetToken){
  throw Error(" Invalid or expired token ") 
}


//new hashed password
const newHashedPassword = await hashPassword(newPassword);

//update user
await prisma.user.update({
  where : {id : resetToken.userId},
  data : {password : newHashedPassword}
});

//delete token
await prisma.passwordResetToken.delete({
  where : { id : resetToken.id}
});


return {message : "password reset successfully"}



};


export const changePasswordService = async ({ userId, oldPassword, newPassword }) => {

  if( !oldPassword || !newPassword ){
    throw Error("old password and new password requried");
  }

  //get user
  const user = await prisma.user.findUnique({
    where : { id : userId}
  });

  if(!user){
    throw Error("user not found");
  }

  //checking password
  const isMatch = await comparePassword(oldPassword, user.password);

  if(!isMatch){
    throw Error("old password is inncorrect");
  }

  //prevent same password
  const isSame = await comparePassword(newPassword, user.password);

  if(isSame){
    throw Error(" New password cannot be same as old password");
  }

  const hashedPassword = await hashPassword(newPassword);

  //update password
  await prisma.user.update({
    where : {id : userId},
    data : {password : hashedPassword}
  });

  await prisma.auditLog.create({
    data : {
      userId,
      action : "changed_password",
      module : "AUTH"
    }
  });

  return {message : "password changed successfully"};
}

export const updateUserProfileService = async (userId, data = {}) => {
  const { name, email, profileLogo } = data;
  console.log(`🛠️ Updating profile for user ${userId}. Received fields:`, Object.keys(data));

  if (profileLogo !== undefined && profileLogo !== null) {
    if (typeof profileLogo !== "string") {
      throw new Error("profileLogo must be a string");
    }

    const normalizedLogo = profileLogo.trim();
    
    // Accept anything that looks like a URL or a Base64 string
    const isHttpUrl = normalizedLogo.startsWith("http");
    const isDataUrl = normalizedLogo.startsWith("data:image");
    const isProbablyBase64 = normalizedLogo.length > 100; // Large strings are usually images

    if (!isHttpUrl && !isDataUrl && !isProbablyBase64) {
      throw new Error("Invalid image format provided");
    }
  }

  // If email is being changed, check for conflicts
  if (email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        NOT: { id: userId }
      }
    });

    if (existingUser) {
      throw new Error("Email already in use by another account");
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: name || undefined,
      email: email ? email.trim().toLowerCase() : undefined,
      profileLogo: profileLogo?.trim() || undefined,
    }
  });

  return {
    message: "Profile updated successfully",
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      profileLogo: updatedUser.profileLogo,
      ...(updatedUser.companyId && { companyId: updatedUser.companyId })
    }
  };
};


//super admin register 
export const registerSuperAdminService = async ({
  name,
  email,
  password,
}) => {
  if (!name || !email || !password) {
    throw new Error("Name, email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if Super Admin already exists
  const existingSuperAdmin = await prisma.user.findFirst({
    where: {
      role: "SUPER_ADMIN",
      companyId: null,
    },
  });

  if (existingSuperAdmin) {
    throw new Error("Super Admin already exists");
  }

  // Check email
  const existingUser = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
    },
  });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await hashPassword(password);

  const superAdmin = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      companyId: null,
    },
  });

  return {
    message: "Super Admin registered successfully",
    user: {
      id: superAdmin.id,
      name: superAdmin.name,
      email: superAdmin.email,
      role: superAdmin.role,
      status: superAdmin.status,
    },
  };
};
