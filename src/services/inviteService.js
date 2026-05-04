import prisma from "../config/db.js";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";
import { hashPassword } from "../utils/hashPassword.js";

export const inviteService = async (data) => {
  const {
    email,
    role,
    companyId,
    isNewHire,
    offerData,
    createdById,
    name,
    password,
    departmentId,
    designationId
  } = data;

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
    // 🔥 OPTION A: DIRECT CREATE (Existing HR / Migration)
    if (!isNewHire && password) {
      const hashedPassword = await hashPassword(password);
      
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: name || "HR Admin",
            email: normalizedEmail,
            password: hashedPassword,
            role: "HR",
            companyId,
            status: "ACTIVE",
            isEmailVerified: true
          }
        });

        const employee = await tx.employee.create({
          data: {
            userId: user.id,
            companyId,
            employeeCode: `HR-${Date.now()}`,
            departmentId,
            designationId,
            joiningDate: new Date(),
            employmentType: "EXPERIENCED",
          }
        });

        await tx.hR.create({
          data: {
            userId: user.id,
            permissions: {
              canManageEmployees: true,
              canManageAttendance: true,
              canManageLeaves: true,
              canManagePayroll: true
            }
          }
        });

        return { user, employee };
      });

      await sendEmail(
        normalizedEmail,
        "Welcome to HRMS",
        `<h3>Welcome aboard!</h3>
         <p>Your HR account has been created.</p>
         <p>Email: ${normalizedEmail}</p>
         <p>You can login now at: ${process.env.FRONTEND_URL}/login</p>`
      );

      return { message: "Existing HR created successfully", userId: result.user.id };
    }

    // 🔥 OPTION B: INVITE FLOW (New HR)
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
       <p>Please click the link below to setup your account:</p>
       <a href="${process.env.FRONTEND_URL}/accept-invite?token=${rawToken}">
       Setup HR Account</a>`
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
