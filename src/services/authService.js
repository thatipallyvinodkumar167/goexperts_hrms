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
        companyId: superAdmin.companyId,
      },
      token: generateToken(superAdmin),
    };
  }

  // Company user login path (derive company from email domain)
  const [, emailDomain] = normalizedEmail.split("@");
  if (!emailDomain) {
    throw new Error("Invalid email format");
  }

  const company = await prisma.company.findFirst({
    where: {
      domain: emailDomain,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  if (!company) {
    throw new Error("Company not found for this email domain");
  }

  const user = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      companyId: company.id,
      status: "ACTIVE",
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }


    // ⭐ CHANGE 3 → UPDATE LAST LOGIN
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });


  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileLogo: user.profileLogo,
      companyId: user.companyId,
    },
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
const resetLink = `${process.env.FRONTEND_URL}://reset-password?token=${rawToken}`;

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

  if (profileLogo !== undefined && profileLogo !== null) {
    if (typeof profileLogo !== "string" || !profileLogo.trim()) {
      throw new Error("profileLogo must be a non-empty string");
    }

    const normalizedLogo = profileLogo.trim();
    const isDataUrlImage = /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(normalizedLogo);
    if (!isDataUrlImage) {
      throw new Error("profileLogo must be a valid base64 image data URL");
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
      companyId: updatedUser.companyId
    }
  };
};
