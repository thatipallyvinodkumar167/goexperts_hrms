import prisma from "../config/db.js";
import crypto from "crypto";
import { hashPassword } from "../utils/hashPassword.js";
import { assignTrialSubscription } from "./subscriptionService.js";

// ✅ NEW IMPORTS (ADDED)
import { sendEmail } from "../utils/sendEmail.js";
import { companyInviteTemplate } from "../utils/templates/companyInviteTemplate.js";

//////////////////////////
// 1. CREATE COMPANY + INVITE
//////////////////////////

export const createCompanyWithInvite = async ({
  name,
  email,
  ownerName,
  ownerEmail,
  location,
  createdById,
}) => {

  if (!email || !email.includes("@")) {
    throw new Error("Invalid company email address");
  }

  const [, domain] = email.split("@");
  const publicDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];
  const isPublic = publicDomains.includes(domain.toLowerCase());

  // check existing email or domain (skip domain check if it's a public provider)
  const existing = await prisma.company.findFirst({
    where: { 
      OR: [
        { email },
        !isPublic ? { domain } : {}
      ].filter(Boolean)
    },
  });

  if (existing) {
    const reason = existing.email === email ? "Email" : "Domain";
    throw new Error(`Company with this ${reason} already exists`);
  }

  // ✅ TOKEN GENERATION (NO CHANGE, BUT USED PROPERLY NOW)
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  const result = await prisma.$transaction(async (tx) => {

    const company = await tx.company.create({
      data: {
        name,
        email,
        domain,
        ownerName,
        ownerEmail,
        location,

        // ✅ STATUS FLOW (IMPROVED)
        status: "INVITED",
        invitedAt: new Date(),

        createdById,
      },
    });

    const ownerUser = await tx.user.create({
      data: {
        name: ownerName,
        email: email,
        password: "", // not set yet
        role: "OWNER",
        companyId: company.id,
        status: "INVITED",
      },
    });

    // ✅ STORE TOKEN (CORRECT)
    await tx.companyInvite.create({
      data: {
        email: email,
        token: hashedToken,
        companyId: company.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // ❌ REMOVED rawToken from return (SECURITY FIX)
    return { company, ownerUser };
  });

  // ✅ SEND EMAIL (OUTSIDE TRANSACTION TO AVOID TIMEOUTS)
  const inviteLink = `${process.env.FRONTEND_URL}://setup-account?token=${rawToken}`;
  
  try {
    // Send invitation to the COMPANY EMAIL only (as requested)
    await sendEmail(
      email,
      "Activate Your Company Account",
      companyInviteTemplate(ownerName, inviteLink)
    );
  } catch (error) {
    console.error("Delayed Email Error:", error.message);
    // We don't throw here because the DB records are already saved
  }

  return {
    ...result,
    message : "Company created and invitation email triggered",
  };
};

//////////////////////////
// 2. SETUP ACCOUNT
//////////////////////////

export const setupCompanyAccount = async (token, password) => {

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const invite = await prisma.companyInvite.findFirst({
    where: {
      token: hashedToken,
      expiresAt: { gt: new Date() },
    },
  });

  if (!invite) {
    throw new Error("Invalid or expired token");
  }

  const user = await prisma.user.findFirst({
    where: { email: invite.email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const hashedPassword = await hashPassword(password);

  await prisma.$transaction(async (tx) => {

    // ✅ USER ACTIVATE
    await tx.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        status: "ACTIVE",
        lastLoginAt: new Date(), // ✅ ADDED
      },
    });

    // ✅ COMPANY EMAIL VERIFIED + ACTIVE
    await tx.company.update({
      where: { id: invite.companyId },
      data: {
        status: "ACTIVE",
        activatedAt: new Date(),
        lastActiveAt: new Date(), // ✅ ADDED
      },
    });

    // ✅ MARK INVITE USED
    await tx.companyInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
  });

  return { message: "Account setup successful" };
};

//////////////////////////
// 3. COMPLETE PROFILE
//////////////////////////

export const completeCompanyProfile = async (companyId, data) => {

  const updated = await prisma.company.update({
    where: { id: companyId },
    data: {
      ...data,
      isProfileCompleted: true,   // ✅ make sure field exists in schema
      status: "PENDING_APPROVAL",
    },
  });

  return updated;
};

export const updateCompanyProfile = async (companyId, data) => {
  return prisma.company.update({
    where: { id: companyId },
    data: {
      name: data.name || undefined,
      location: data.location || undefined,
      companyLogo: data.companyLogo || undefined,
      // allow owner details update too
      ownerName: data.ownerName || undefined,
      ownerEmail: data.ownerEmail || undefined,
    }
  });
};

//////////////////////////
// 4. ACTIVATE COMPANY
//////////////////////////

export const activateCompany = async (companyId) => {

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { subscriptions: true },
  });

  if (!company) {
    throw new Error("Company not found");
  }

  // ❌ REMOVED isEmailVerified check (you don't have this field)
  // ✔ Instead rely on status flow

  if (company.status !== "PENDING_APPROVAL" && company.status !== "ACTIVE") {
    throw new Error("Company not ready for activation");
  }

  if (!company.subscriptions.length) {
    await assignTrialSubscription(companyId);
  }

  return prisma.company.update({
    where: { id: companyId },
    data: {
      status: "ACTIVE",
      activatedAt: new Date(),
      lastActiveAt: new Date(),
    },
  });
};

//////////////////////////
// 5. ADMIN VIEW
//////////////////////////

export const getCompaniesForAdmin = async () => {
  return prisma.company.findMany({
    include: {
      subscriptions: {
        include: { plan: true },
        orderBy: { endDate: "desc" },
        take: 1,
      },
      createdBy: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });
};

//////////////////////////
// 6. RESEND INVITE
//////////////////////////

export const resendCompanyInvite = async (companyId) => {

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new Error("Company not found");
  }

  // Only allow resend if not already active
  if (company.status !== "INVITED") {
    throw new Error(`Cannot resend invite. Company status is ${company.status}`);
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  // Update existing invite or create new one
  await prisma.companyInvite.deleteMany({
    where: { companyId: company.id }
  });

  await prisma.companyInvite.create({
    data: {
      email: company.email,
      token: hashedToken,
      companyId: company.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const inviteLink = `${process.env.FRONTEND_URL}://setup-account?token=${rawToken}`;
  
  await sendEmail(
    company.email,
    "New Activation Link - GoExperts HRMS",
    companyInviteTemplate(company.ownerName, inviteLink)
  );

  return { message: "New invitation link sent successfully" };
};
