import prisma from "../config/db.js";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";

export const inviteService = async ({
  email,
  role,
  companyId,
  isNewHire,
  offerData,
  createdById
}) => {

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findFirst({
    where: { email: normalizedEmail, companyId }
  });

  if (existingUser) {
    throw new Error("User already exists in company");
  }

  const rawToken = crypto.randomBytes(32).toString("hex");

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  let invite;

  ////////////////////////
  // HR FLOW
  ////////////////////////
  if (role === "HR") {

    invite = await prisma.employeeInvite.create({
      data: {
        email: normalizedEmail,
        token: rawToken,
        role: "HR",
        companyId,
        expiresAt
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

  ////////////////////////
  // EMPLOYEE FLOW
  ////////////////////////
  else if (role === "EMPLOYEE") {

    // 🔥 NEW EMPLOYEE (Offer Flow)
    if (isNewHire) {

      if (!offerData) {
        throw new Error("Offer data required");
      }

      await prisma.offerLetter.create({
        data: {
          employeeEmail: normalizedEmail,
          companyId,
          salary: offerData.salary,
          joiningDate: new Date(offerData.joiningDate),
          position: offerData.position,
          status: "SENT"
        }
      });

      await sendEmail(
        normalizedEmail,
        "Offer Letter",
        `<h2>Offer Letter</h2>
         <p>Salary: ${offerData.salary}</p>
         <p>Joining: ${offerData.joiningDate}</p>
         <a href="${process.env.FRONTEND_URL}/accept-offer?email=${normalizedEmail}">
         Accept Offer</a>`
      );

      return { message: "Offer sent successfully" };
    }

    // 🔥 EXISTING EMPLOYEE
    invite = await prisma.employeeInvite.create({
      data: {
        email: normalizedEmail,
        token: rawToken,
        role: "EMPLOYEE",
        companyId,
        expiresAt
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

  ////////////////////////
  // AUDIT LOG
  ////////////////////////
  await prisma.auditLog.create({
    data: {
      userId: createdById,
      action: "INVITE_SENT",
      module: role
    }
  });

  return {
    message: `${role} invite sent`,
    inviteToken: rawToken
  };
};




//acceptInviteService
import { hashPassword } from "../utils/hashPassword.js";

export const acceptInviteService = async ({ token, password, name }) => {

  const invite = await prisma.employeeInvite.findFirst({
    where: {
      token,
      expiresAt: { gt: new Date() },
      acceptedAt: null
    }
  });

  if (!invite) {
    throw new Error("Invalid or expired invite");
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email: invite.email,
      password: hashedPassword,
      role: invite.role,
      companyId: invite.companyId,
      status: "PENDING_APPROVAL",
      isEmailVerified: false
    }
  });

  await prisma.employeeInvite.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date() }
  });

  return {
    message: "Password set. Verify email next",
    userId: user.id
  };
};




//STAGE 3: VERIFY EMAIL
export const verifyEmailService = async (userId) => {

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) throw new Error("User not found");

  await prisma.user.update({
    where: { id: userId },
    data: { isEmailVerified: true }
  });

  return { message: "Email verified" };
};





//STAGE 4: COMPLETE PROFILE
export const completeProfileService = async ({
  userId,
  personal,
  departmentId,
  designationId
}) => {

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) throw new Error("User not found");

  const employee = await prisma.employee.create({
    data: {
      userId,
      companyId: user.companyId,
      employeeCode: `EMP-${Date.now()}`,

      departmentId,
      designationId,

      joiningDate: new Date(),
      employmentType: "FRESHER",

      personal: {
        create: personal
      }
    }
  });

  return { message: "Profile completed", employee };
};






//STAGE 5: ACTIVATE USER
export const activateUserService = async (userId) => {

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) throw new Error("User not found");

  if (!user.isEmailVerified) {
    throw new Error("Verify email first");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: "ACTIVE" }
  });

  return { message: "User activated" };
};





