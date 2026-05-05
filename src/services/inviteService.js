import prisma from "../config/db.js";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";
import { hashPassword } from "../utils/hashPassword.js";
import { generateOfferLetter } from "../utils/pdfGenerator.js";

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
  // 🔥 1. NEW HIRE FLOW (Offer Letter for HR or EMPLOYEE)
  ////////////////////////
  if (isNewHire) {
      if (!offerData) throw new Error("Offer data required");

      await prisma.offerLetter.create({
          data: {
              employeeEmail: normalizedEmail,
              companyId,
              salary: offerData.salary,
              joiningDate: new Date(offerData.joiningDate),
              position: offerData.position,
              role: role, // HR or EMPLOYEE
              status: "SENT"
          }
      });

      // Generate the Offer Letter PDF in the background
      generateOfferLetter({
          email: normalizedEmail,
          position: offerData.position,
          salary: offerData.salary,
          joiningDate: offerData.joiningDate
      }).then(({ filePath, fileName }) => {
          sendEmail(
            normalizedEmail,
            "Offer Letter - GOExperts HRMS",
            `<h2>Congratulations!</h2>
             <p>We are pleased to offer you the position of <strong>${offerData.position}</strong>.</p>
             <p>Please find your formal offer letter attached to this email.</p>
             <br/>
             <p>Click below to accept your offer directly:</p>
             <a href="${process.env.BACKEND_URL || 'https://goexperts-hrms.onrender.com'}/api/invite/accept-offer?email=${normalizedEmail}" 
                style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 10px;">
                Accept Offer
             </a>`,
            [{ filename: fileName, path: filePath }]
          ).catch(err => console.error("Offer Email Failed:", err.message));
      }).catch(err => console.error("PDF Generation Failed:", err.message));

      return { message: "Offer and PDF sent successfully" };
  }

  ////////////////////////
  // 🔥 2. MIGRATION FLOW (Existing HR with Password)
  ////////////////////////
  if (!isNewHire && role === "HR" && password) {
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

      sendEmail(
        normalizedEmail,
        "Welcome to HRMS",
        `<h3>Welcome aboard!</h3>
         <p>Your HR account has been created.</p>
         <p>Email: ${normalizedEmail}</p>
         <p>You can login now at: ${process.env.FRONTEND_URL}/login</p>`
      ).catch(err => console.error("Migration Email Failed:", err.message));

      return { message: "Account activated successfully and Welcome Letter sent" };
  }

  ////////////////////////
  // 🔥 3. STANDARD INVITE FLOW (Existing Employee/HR without Offer)
  ////////////////////////
  invite = await prisma.employeeInvite.create({
      data: {
          email: normalizedEmail,
          token: rawToken,
          role: role,
          companyId,
          expiresAt
      }
  });

  sendEmail(
      normalizedEmail,
      `${role === "HR" ? "HR" : "Employee"} Invitation`,
      `<h3>You are invited to join as ${role === "HR" ? "HR" : "an Employee"}</h3>
       <a href="${process.env.FRONTEND_URL}/setup-password?token=${rawToken}">
       Setup Account</a>`
  ).catch(err => console.error("Invite Email Failed:", err.message));

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

// --- NEW: THE BRIDGE BETWEEN OFFER AND INVITE ---
export const acceptOfferService = async (email) => {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Find the SENT offer
    const offer = await prisma.offerLetter.findFirst({
        where: { employeeEmail: normalizedEmail, status: "SENT" },
        orderBy: { createdAt: "desc" }
    });

    if (!offer) throw new Error("No active offer found for this email");

    // 2. Mark as ACCEPTED
    await prisma.offerLetter.update({
        where: { id: offer.id },
        data: { status: "ACCEPTED" }
    });

    // 3. Automatically trigger the Invitation (Phase 2)
    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await prisma.employeeInvite.create({
        data: {
            email: normalizedEmail,
            token: rawToken,
            role: offer.role, // Use the role stored during Phase 1
            companyId: offer.companyId,
            expiresAt
        }
    });

    // 4. Send the "Setup Account" email (Only after acceptance)
    sendEmail(
        normalizedEmail,
        "Welcome! Setup your HRMS Account",
        `<h3>Offer Accepted!</h3>
         <p>Thank you for accepting the offer to join us as <strong>${offer.position}</strong>.</p>
         <p>We are excited to have you join the team.</p>
         <p>The final step is to set up your password to begin your digital onboarding.</p>
         <br/>
         <a href="${process.env.FRONTEND_URL}/setup-password?token=${rawToken}" 
            style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Set Password & Join
         </a>`
    ).catch(err => console.error("Setup Account Email Failed:", err.message));

    return { message: "Offer accepted successfully. Setup email sent." };
};
